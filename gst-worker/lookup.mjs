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
  // Playwright's own default action/navigation timeout is 30s -- the same
  // ceiling Netlify Functions die at. A slow/stuck click or screenshot could
  // silently eat the whole function budget and get killed by the platform
  // before answerSession()'s try/catch ever got a chance to handle it
  // cleanly. Failing fast here means a real hiccup surfaces as a handled
  // error in a few seconds instead of a hard timeout with no clean response.
  page.setDefaultTimeout(8000);
  page.setDefaultNavigationTimeout(15000);
  await page.goto(SEARCH_URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  // Explicit, longer timeout here specifically -- this is the one action in
  // the whole session guaranteed to run exactly once (not compounded across
  // retries the way submitAnswer()'s actions are), and on a slower network
  // path to the portal (e.g. a VPS further from India than a local dev
  // machine), Angular's bootstrap after "networkidle" can legitimately take
  // longer than the page's tighter 8s default. Bumping this one call doesn't
  // reintroduce the compounding-timeout bug that default exists to prevent.
  await page.click(SELECTORS.gstinInput, { timeout: 20000 });
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

  // Actively wait for whichever of these actually happens, instead of a
  // fixed delay then a one-off visibility check. That fixed-delay version
  // was a real race: if the portal took even a bit longer than the delay to
  // render the error, the check fired too early, wrongly concluded the
  // captcha was accepted, and fell through to scrapeResult() against a page
  // that never actually loaded results -- each field lookup there then
  // waited out its own timeout in sequence, compounding well past Netlify's
  // 30s function budget. Racing both outcomes with a real wait fixes the
  // false negative and bounds the worst case to this one timeout.
  const outcome = await Promise.race([
    page.locator(SELECTORS.captchaError).waitFor({ state: "visible", timeout: 10000 }).then(() => "error").catch(() => null),
    page.locator(SELECTORS.resultsPanel).waitFor({ state: "visible", timeout: 10000 }).then(() => "result").catch(() => null),
  ]);
  // Neither appeared (outcome === null) is treated as wrong too -- refreshing
  // and trying again is the safe default when we can't confirm success.
  const wrong = outcome !== "result";

  if (wrong) {
    await page.click(SELECTORS.refreshCaptcha);
    // Refresh swaps the <img> src -- wait for it to actually be visible
    // again rather than trust a fixed delay, which could screenshot mid-swap.
    await page.waitForSelector(SELECTORS.captchaImage, { state: "visible", timeout: 5000 });
    await page.waitForTimeout(500);
    const captchaImage = await page.locator(SELECTORS.captchaImage).screenshot();
    return { ok: false, captchaImage };
  }

  // The results panel is already confirmed visible at this point, so the
  // individual field lookups inside scrapeResult() should resolve near-
  // instantly -- a short timeout here bounds the worst case tightly instead
  // of inheriting the page's more patient 8s default per field.
  page.setDefaultTimeout(3000);
  const data = await scrapeResult(page);
  return { ok: true, data };
}

export async function closeLookup(browser) {
  await browser.close().catch(() => {});
}
