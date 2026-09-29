// One-time-per-buyer automation: look a buyer's GSTIN up on the GST
// portal's free, public "Search Taxpayer" tool, store the summary (PIN
// code / state code / verified flag) on the Buyer row, and keep a full
// GstVerification row with everything the portal returned.
//
// This is the automation EWAY_BILL.md and the eway-poc README distinguish
// from the actual e-way bill submission: services.gst.gov.in/services/searchtp
// needs no login and no OTP -- just a GSTIN and a captcha -- because it's a
// public registry lookup, not an authenticated filing action. It solves the
// captcha with Claude the same way scripts/eway-poc does, but nothing here
// generates a compliance document; it only fills in data our own Buyer form
// would otherwise need typed in by hand once per buyer.
//
// Writes to whatever DATABASE_URL is active in .env -- currently staging.
// Do not point this at prod without deciding to.
//
// -----------------------------------------------------------------------
// Selectors confirmed against the real page on 2026-09-29/30 (Angular SPA --
// static HTML fetches won't show these; they only exist after the JS app
// renders). If the portal changes its markup and this starts failing, redo
// this by hand: `node scripts/gstin-lookup/lookup-and-store.mjs --buyer <id>`
// with `headless: false` below temporarily, or screenshot each step.
//
// Two non-obvious things learned running this live:
// - The GSTIN field only reveals the captcha on real keystroke events
//   (Angular's ng-keyup); Playwright's .fill() sets the value without firing
//   those, so the captcha never appears. Must use keyboard.type().
// - The captcha image has a decorative world-map watermark that sometimes
//   sits directly over 1-2 characters, occasionally making an otherwise
//   sharp captcha ambiguous. solveCaptcha's UNSURE path + the refresh below
//   handles this by trying again rather than guessing through it.
// -----------------------------------------------------------------------

import "dotenv/config";
import { randomUUID } from "node:crypto";
import pg from "pg";
import { chromium } from "playwright";
import { solveCaptcha } from "../lib/solveCaptcha.mjs";
import { stateCodeFromName } from "./stateNames.mjs";

const SEARCH_URL = "https://services.gst.gov.in/services/searchtp";

const SELECTORS = {
  gstinInput: "#for_gstin",
  captchaImage: "#imgCaptcha",
  captchaInput: "#fo-captcha",
  refreshCaptcha: 'button[ng-click="refreshCaptcha()"]',
  submit: "#lotsearch",
  captchaError: "text=/enter valid letters shown/i",
  resultAddress: '[data-ng-bind="searchTaxpre_Payload.pradr.adr"]', // "Principal Place of Business"
  resultsPanel: ".tbl-format", // the whole results block -- see rawFullText()
};

const MAX_CAPTCHA_ATTEMPTS = 3;
const DELAY_BETWEEN_BUYERS_MS = 4000; // be polite to a public tool, not just to avoid lockout

function extractPincodeFromText(text) {
  const matches = text.match(/(?<![0-9])[1-9][0-9]{5}(?![0-9])/g);
  return matches ? Number(matches[matches.length - 1]) : null;
}

/** GST addresses render as "..., <City>, <State>, <Pincode>" -- the last two
 * comma-separated segments, reliably, so both come from this one field. */
function parseAddress(address) {
  const parts = (address ?? "").split(",").map((p) => p.trim());
  const pincode = extractPincodeFromText(address ?? "");
  const stateText = parts.length >= 2 ? parts[parts.length - 2] : null;
  const stateCode = stateText ? stateCodeFromName(stateText) : null;
  return { pincode, stateCode };
}

// :has-text() does substring + whitespace-normalized matching, unlike
// :text-is() -- more robust against label text like "GSTIN / UIN  Status"
// (the portal's own markup has a double space in there).
async function fieldByLabel(page, label) {
  const value = await page
    .locator(`.col-sm-4:has(strong:has-text("${label}"))`)
    .locator("p")
    .nth(1)
    .innerText()
    .catch(() => null);
  return value?.trim() ?? null;
}

/** The Administrative Office / Other Office jurisdiction blocks are <ul><li>
 * lists (e.g. ["(JURISDICTION - STATE)", "State - Jammu and Kashmir", ...]),
 * not a single value -- fieldByLabel doesn't fit these. */
async function jurisdictionLines(page, label) {
  const items = await page
    .locator(`.col-sm-4:has(strong:has-text("${label}")) li`)
    .allInnerTexts()
    .catch(() => []);
  return items.map((s) => s.trim()).filter(Boolean);
}

async function textOrNull(page, selector) {
  const value = await page.locator(selector).innerText().catch(() => null);
  return value?.trim() ?? null;
}

/** "Dealing In Goods and Services" table -> [{hsn, description, type}]. */
async function goodsServicesTable(page) {
  const rows = await page
    .locator('table.tbl.inv.exp tbody tr[data-ng-repeat]')
    .evaluateAll((trs) =>
      trs.map((tr) => Array.from(tr.querySelectorAll("td")).map((td) => td.textContent?.trim() ?? ""))
    )
    .catch(() => []);
  const out = [];
  for (const [goodsHsn, goodsDesc, svcHsn, svcDesc] of rows) {
    if (goodsHsn) out.push({ hsn: goodsHsn, description: goodsDesc, type: "goods" });
    if (svcHsn) out.push({ hsn: svcHsn, description: svcDesc, type: "service" });
  }
  return out;
}

async function lookupOne(page, gstin) {
  await page.goto(SEARCH_URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.click(SELECTORS.gstinInput);
  await page.keyboard.type(gstin, { delay: 80 }); // see note above: fill() won't reveal the captcha
  await page.waitForSelector(SELECTORS.captchaImage, { timeout: 10000 });
  await page.waitForTimeout(800);

  for (let attempt = 1; attempt <= MAX_CAPTCHA_ATTEMPTS; attempt++) {
    const captchaBuffer = await page.locator(SELECTORS.captchaImage).screenshot();
    const guess = await solveCaptcha(captchaBuffer);

    if (guess === "UNSURE") {
      console.log(`  captcha attempt ${attempt}: model unsure, reloading...`);
      await page.click(SELECTORS.refreshCaptcha);
      await page.waitForTimeout(1000);
      continue;
    }

    console.log(`  captcha attempt ${attempt}: trying "${guess}"`);
    await page.click(SELECTORS.captchaInput);
    await page.keyboard.type(guess, { delay: 50 });
    await page.click(SELECTORS.submit);
    await page.waitForTimeout(1500);

    const captchaWasWrong = await page.locator(SELECTORS.captchaError).isVisible().catch(() => false);
    if (!captchaWasWrong) break;
    console.log("  captcha rejected, retrying...");
    if (attempt === MAX_CAPTCHA_ATTEMPTS) {
      throw new Error(`Captcha not solved after ${MAX_CAPTCHA_ATTEMPTS} attempts.`);
    }
  }

  const legalName = await fieldByLabel(page, "Legal Name of Business");
  const tradeName = await fieldByLabel(page, "Trade Name");
  const registrationDate = await fieldByLabel(page, "Effective Date of registration");
  const constitutionOfBusiness = await fieldByLabel(page, "Constitution of Business");
  const gstinStatus = await fieldByLabel(page, "GSTIN / UIN");
  const taxpayerType = await fieldByLabel(page, "Taxpayer Type");
  const address = await textOrNull(page, SELECTORS.resultAddress);
  const { pincode, stateCode } = parseAddress(address);

  // Everything else: captured but not individually typed, so a portal
  // layout tweak doesn't silently drop data (see the `raw` column comment
  // in schema.prisma).
  const adminOffice = await jurisdictionLines(page, "Administrative Office");
  const otherOffice = await jurisdictionLines(page, "Other Office");
  const natureOfCoreBusinessActivity = await textOrNull(page, "#ntcrbs span[data-ng-bind]");
  const natureOfBusinessActivities = (await page.locator(".list-child-inline li").allInnerTexts().catch(() => []))
    .map((s) => s.trim())
    .filter(Boolean);
  const goodsServices = await goodsServicesTable(page);
  const fullText = await textOrNull(page, SELECTORS.resultsPanel);

  return {
    legalName,
    tradeName,
    registrationDate,
    constitutionOfBusiness,
    gstinStatus,
    taxpayerType,
    address,
    pincode,
    stateCode,
    raw: { adminOffice, otherOffice, natureOfCoreBusinessActivity, natureOfBusinessActivities, goodsServices, fullText },
  };
}

const BUYER_COLS = `id, name, gstin, pincode, "stateCode", "gstVerifiedAt"`;

async function fetchBuyers(client, args) {
  if (args.buyerId) {
    const { rows } = await client.query(`select ${BUYER_COLS} from "Buyer" where id = $1`, [
      args.buyerId,
    ]);
    if (rows.length === 0) throw new Error(`No buyer with id ${args.buyerId}`);
    return rows;
  }
  // --all-missing: every buyer with a GSTIN that hasn't been verified yet
  const { rows } = await client.query(
    `select ${BUYER_COLS} from "Buyer"
     where gstin is not null and gstin <> '' and "gstVerifiedAt" is null
     order by name`
  );
  return rows;
}

function parseArgs() {
  const args = { buyerId: null, allMissing: false };
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--buyer") args.buyerId = argv[++i];
    else if (argv[i] === "--all-missing") args.allMissing = true;
  }
  if (!args.buyerId && !args.allMissing) {
    console.error("Usage: node lookup-and-store.mjs --buyer <buyerId> | --all-missing");
    process.exit(1);
  }
  return args;
}

async function saveResult(db, buyer, found) {
  await db.query("BEGIN");
  try {
    await db.query(
      `update "Buyer"
       set pincode = $1, "stateCode" = $2, "gstVerifiedAt" = now(),
           "gstLegalName" = $3, "gstTradeName" = $4, "gstAddress" = $5
       where id = $6`,
      [found.pincode, found.stateCode, found.legalName, found.tradeName, found.address, buyer.id]
    );
    await db.query(
      `insert into "GstVerification"
         (id, "buyerId", gstin, "legalName", "tradeName", "registrationDate",
          "constitutionOfBusiness", "gstinStatus", "taxpayerType",
          "principalAddress", pincode, "stateCode", raw)
       values
         ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        randomUUID(),
        buyer.id,
        buyer.gstin,
        found.legalName,
        found.tradeName,
        found.registrationDate,
        found.constitutionOfBusiness,
        found.gstinStatus,
        found.taxpayerType,
        found.address,
        found.pincode,
        found.stateCode,
        JSON.stringify(found.raw),
      ]
    );
    await db.query("COMMIT");
  } catch (err) {
    await db.query("ROLLBACK");
    throw err;
  }
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("Set ANTHROPIC_API_KEY (for captcha solving).");
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set -- run this from the project root with a populated .env.");
    process.exit(1);
  }

  const args = parseArgs();
  const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();

  const buyers = await fetchBuyers(db, args);
  if (buyers.length === 0) {
    console.log("No buyers to look up (everyone with a GSTIN is already verified, or bad --buyer id).");
    await db.end();
    return;
  }
  console.log(`Looking up ${buyers.length} buyer(s) against ${SEARCH_URL}\n`);

  // Headless is fine here (unlike eway-poc) -- no OTP, no human step needed.
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const results = [];

  for (const buyer of buyers) {
    if (!buyer.gstin) {
      console.log(`- ${buyer.name}: no GSTIN on file, skipping`);
      results.push({ buyer: buyer.name, status: "skipped (no GSTIN)" });
      continue;
    }
    console.log(`- ${buyer.name} (${buyer.gstin})`);
    try {
      const found = await lookupOne(page, buyer.gstin);
      console.log(`  legal name: ${found.legalName ?? "?"}  trade name: ${found.tradeName ?? "?"}`);
      console.log(`  status: ${found.gstinStatus ?? "?"}  type: ${found.taxpayerType ?? "?"}  constitution: ${found.constitutionOfBusiness ?? "?"}`);
      console.log(`  address: ${found.address ?? "?"}`);
      console.log(`  pincode=${found.pincode} stateCode=${found.stateCode}`);
      console.log(`  goods/services: ${found.raw.goodsServices.length} HSN/SAC rows captured`);
      if (buyer.name !== (found.legalName ?? found.tradeName)) {
        console.log(`  note: buyer is saved as "${buyer.name}" here, GST shows a different name -- compare above, not auto-applied.`);
      }

      if (!found.pincode || !found.stateCode) {
        // Deliberately not marking gstVerifiedAt here -- an incomplete result
        // isn't a verification, it's a failed one. Re-run once selectors/the
        // page layout are confirmed correct.
        results.push({ buyer: buyer.name, status: "incomplete result, not saved", detail: JSON.stringify(found) });
        continue;
      }

      await saveResult(db, buyer, found);
      results.push({
        buyer: buyer.name,
        status: "verified",
        detail: `pincode ${buyer.pincode ?? "∅"} -> ${found.pincode}, state ${buyer.stateCode ?? "∅"} -> ${found.stateCode}`,
      });
    } catch (err) {
      console.error(`  failed: ${err.message}`);
      results.push({ buyer: buyer.name, status: "failed", detail: err.message });
    }

    if (buyers.indexOf(buyer) < buyers.length - 1) {
      await new Promise((r) => setTimeout(r, DELAY_BETWEEN_BUYERS_MS));
    }
  }

  console.log("\nSummary:");
  console.table(results);

  await browser.close();
  await db.end();
}

main();
