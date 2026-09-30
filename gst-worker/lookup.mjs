// Two-phase, session-resumable version of the scraping logic in
// scripts/gstin-lookup/lookup-and-store.mjs. That script solves the captcha
// itself (via Claude) in one synchronous loop; this instead hands the
// captcha image back to a caller and waits -- open()'s page stays alive
// across the gap between showing the captcha and receiving submitAnswer()'s
// answer, which is the whole reason this runs as a persistent process
// instead of a Netlify Function (see server.mjs).
//
// Selectors and field-scraping logic are unchanged from lookup-and-store.mjs
// -- keep both in sync if the portal's markup changes. stateCodeFromName is
// imported directly from that script's directory rather than duplicated.

import { chromium } from "playwright";
import { stateCodeFromName } from "../scripts/gstin-lookup/stateNames.mjs";

const SEARCH_URL = "https://services.gst.gov.in/services/searchtp";

const SELECTORS = {
  gstinInput: "#for_gstin",
  captchaImage: "#imgCaptcha",
  captchaInput: "#fo-captcha",
  refreshCaptcha: 'button[ng-click="refreshCaptcha()"]',
  submit: "#lotsearch",
  captchaError: "text=/enter valid letters shown/i",
  resultAddress: '[data-ng-bind="searchTaxpre_Payload.pradr.adr"]',
  resultsPanel: ".tbl-format",
};

function extractPincodeFromText(text) {
  const matches = text.match(/(?<![0-9])[1-9][0-9]{5}(?![0-9])/g);
  return matches ? Number(matches[matches.length - 1]) : null;
}

function parseAddress(address) {
  const parts = (address ?? "").split(",").map((p) => p.trim());
  const pincode = extractPincodeFromText(address ?? "");
  const stateText = parts.length >= 2 ? parts[parts.length - 2] : null;
  const stateCode = stateText ? stateCodeFromName(stateText) : null;
  return { pincode, stateCode };
}

async function fieldByLabel(page, label) {
  const value = await page
    .locator(`.col-sm-4:has(strong:has-text("${label}"))`)
    .locator("p")
    .nth(1)
    .innerText()
    .catch(() => null);
  return value?.trim() ?? null;
}

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

async function goodsServicesTable(page) {
  const rows = await page
    .locator("table.tbl.inv.exp tbody tr[data-ng-repeat]")
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

async function scrapeResult(page) {
  const legalName = await fieldByLabel(page, "Legal Name of Business");
  const tradeName = await fieldByLabel(page, "Trade Name");
  const registrationDate = await fieldByLabel(page, "Effective Date of registration");
  const constitutionOfBusiness = await fieldByLabel(page, "Constitution of Business");
  const gstinStatus = await fieldByLabel(page, "GSTIN / UIN");
  const taxpayerType = await fieldByLabel(page, "Taxpayer Type");
  const address = await textOrNull(page, SELECTORS.resultAddress);
  const { pincode, stateCode } = parseAddress(address);

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

/** Opens a browser+page for one GSTIN and returns the first captcha image.
 * The caller (sessions.mjs) is responsible for keeping `browser`/`page`
 * alive until submitAnswer() or closeSession() is called on them. */
export async function openLookup(gstin) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(SEARCH_URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.click(SELECTORS.gstinInput);
  await page.keyboard.type(gstin, { delay: 80 }); // fill() won't reveal the captcha -- see lookup-and-store.mjs
  await page.waitForSelector(SELECTORS.captchaImage, { timeout: 10000 });
  await page.waitForTimeout(800);
  const captchaImage = await page.locator(SELECTORS.captchaImage).screenshot();
  return { browser, page, captchaImage };
}

/** Submits a captcha answer on an already-open page. On a wrong answer,
 * refreshes the captcha itself and returns the new image for another try --
 * matching the retry pattern confirmed live (refresh before every retry,
 * not just after a few) rather than lookup-and-store.mjs's non-interactive
 * loop, which never needed a human to see the refreshed image. */
export async function submitAnswer(page, answer) {
  await page.fill(SELECTORS.captchaInput, "");
  await page.click(SELECTORS.captchaInput);
  await page.keyboard.type(answer, { delay: 50 });
  await page.click(SELECTORS.submit);
  await page.waitForTimeout(1500);

  const wrong = await page.locator(SELECTORS.captchaError).isVisible().catch(() => false);
  if (wrong) {
    await page.click(SELECTORS.refreshCaptcha);
    await page.waitForTimeout(1000);
    const captchaImage = await page.locator(SELECTORS.captchaImage).screenshot();
    return { ok: false, captchaImage };
  }

  const data = await scrapeResult(page);
  return { ok: true, data };
}

export async function closeLookup(browser) {
  await browser.close().catch(() => {});
}
