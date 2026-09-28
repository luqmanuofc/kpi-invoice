// One-time-per-buyer automation: look a buyer's GSTIN up on the GST
// portal's free, public "Search Taxpayer" tool and store the resulting
// PIN code / state code on that Buyer row.
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
// SELECTORS BELOW ARE PLACEHOLDERS, same caveat as scripts/eway-poc: this has
// never been run against the real page, so there was nothing to test them
// against. Capture the real ones yourself:
//
//   npx playwright codegen https://services.gst.gov.in/services/searchtp
//
// Type a real GSTIN, solve the captcha, submit, and copy the selectors
// Playwright records for: the GSTIN input, the captcha <img>, the captcha
// input, the submit button, and the result fields (legal/trade name,
// principal place of business address, state, and PIN code if it's a
// separate field rather than embedded in the address). Paste them into
// SELECTORS below.
// -----------------------------------------------------------------------

import "dotenv/config";
import pg from "pg";
import { chromium } from "playwright";
import { solveCaptcha } from "../lib/solveCaptcha.mjs";
import { stateCodeFromName } from "./stateNames.mjs";

const SEARCH_URL = "https://services.gst.gov.in/services/searchtp";

const SELECTORS = {
  gstinInput: "TODO", // e.g. '#for_gstin' or 'input[name="gstin"]'
  captchaImage: "TODO",
  captchaInput: "TODO",
  submit: "TODO", // e.g. 'button:has-text("Search")'
  resultLegalName: "TODO",
  resultTradeName: "TODO",
  resultAddress: "TODO", // "Principal Place of Business"
  resultState: "TODO", // omit / leave "TODO" if state isn't a separate field -- falls back to parsing it out of resultAddress
  resultPincode: "TODO", // omit / leave "TODO" if PIN isn't a separate field -- falls back to regex on resultAddress
};

const MAX_CAPTCHA_ATTEMPTS = 3;
const DELAY_BETWEEN_BUYERS_MS = 4000; // be polite to a public tool, not just to avoid lockout

function extractPincodeFromText(text) {
  const matches = text.match(/(?<![0-9])[1-9][0-9]{5}(?![0-9])/g);
  return matches ? Number(matches[matches.length - 1]) : null;
}

async function textOrNull(page, selector) {
  if (selector === "TODO") return null;
  return (await page.locator(selector).innerText().catch(() => null))?.trim() ?? null;
}

async function lookupOne(page, gstin) {
  await page.goto(SEARCH_URL);
  await page.fill(SELECTORS.gstinInput, gstin);

  for (let attempt = 1; attempt <= MAX_CAPTCHA_ATTEMPTS; attempt++) {
    const captchaBuffer = await page.locator(SELECTORS.captchaImage).screenshot();
    const guess = await solveCaptcha(captchaBuffer);

    if (guess === "UNSURE") {
      console.log(`  captcha attempt ${attempt}: model unsure, reloading...`);
      // TODO: click the page's "refresh captcha" control, then continue
      continue;
    }

    console.log(`  captcha attempt ${attempt}: trying "${guess}"`);
    await page.fill(SELECTORS.captchaInput, guess);
    await page.click(SELECTORS.submit);

    // TODO: replace with a real check for this page's actual error text/element
    const captchaWasWrong = await page
      .locator("text=/invalid captcha/i")
      .isVisible()
      .catch(() => false);

    if (!captchaWasWrong) break;
    console.log("  captcha rejected, retrying...");
    if (attempt === MAX_CAPTCHA_ATTEMPTS) {
      throw new Error(`Captcha not solved after ${MAX_CAPTCHA_ATTEMPTS} attempts.`);
    }
  }

  const legalName = await textOrNull(page, SELECTORS.resultLegalName);
  const tradeName = await textOrNull(page, SELECTORS.resultTradeName);
  const address = await textOrNull(page, SELECTORS.resultAddress);
  const stateText = await textOrNull(page, SELECTORS.resultState);
  const pincodeText = await textOrNull(page, SELECTORS.resultPincode);

  const pincode = pincodeText ? Number(pincodeText) : extractPincodeFromText(address ?? "");
  const stateCode = stateText ? stateCodeFromName(stateText) : null;

  return { legalName, tradeName, address, pincode, stateCode };
}

async function fetchBuyers(client, args) {
  if (args.buyerId) {
    const { rows } = await client.query(
      `select id, name, gstin, pincode, "stateCode" from "Buyer" where id = $1`,
      [args.buyerId]
    );
    if (rows.length === 0) throw new Error(`No buyer with id ${args.buyerId}`);
    return rows;
  }
  // --all-missing: every buyer with a GSTIN but no pincode/stateCode yet
  const { rows } = await client.query(
    `select id, name, gstin, pincode, "stateCode" from "Buyer"
     where gstin is not null and gstin <> '' and (pincode is null or "stateCode" is null)
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
    console.log("No buyers to look up (nothing missing pincode/stateCode, or bad --buyer id).");
    await db.end();
    return;
  }
  console.log(`Looking up ${buyers.length} buyer(s) against ${SEARCH_URL}\n`);

  const browser = await chromium.launch({ headless: false });
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
      console.log(`  found: ${found.legalName ?? found.tradeName ?? "?"}, pincode=${found.pincode}, stateCode=${found.stateCode}`);

      if (!found.pincode || !found.stateCode) {
        results.push({ buyer: buyer.name, status: "incomplete result, not saved", detail: JSON.stringify(found) });
        continue;
      }

      await db.query(`update "Buyer" set pincode = $1, "stateCode" = $2 where id = $3`, [
        found.pincode,
        found.stateCode,
        buyer.id,
      ]);
      results.push({
        buyer: buyer.name,
        status: "saved",
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
