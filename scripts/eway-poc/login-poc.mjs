// E-way bill portal automation -- PROOF OF CONCEPT ONLY.
//
// Proves three things end to end: (1) log in with an AI-solved captcha,
// (2) pause for a human-entered OTP, (3) navigate to Generate Bulk and attach
// the bulk JSON. It deliberately STOPS before the final "Upload and Generate"
// click -- nothing here ever submits a real e-way bill.
//
// This is a standalone script, not part of the deployed app (see
// EWAY_BILL.md for why: it needs a long-lived session across a human-entered
// OTP, which Netlify Functions can't hold open).
//
// -----------------------------------------------------------------------
// SELECTORS BELOW ARE PLACEHOLDERS. This script has never been run against
// the real portal -- I don't have a way to load and inspect its live DOM.
// Fill in the real ones yourself:
//
//   npx playwright codegen https://ewaybillgst.gov.in
//
// Log in by hand in the window it opens (real captcha, real OTP). Playwright
// records every click/fill and prints the matching selector as you go. Copy
// the selectors for: username field, password field, captcha <img>, captcha
// input, login submit button, OTP input, OTP submit button, the "e-Waybill ->
// Generate Bulk" menu path, and the file input on that page. Paste them into
// the SELECTORS block below. Leave the codegen script's *recorded values*
// out -- OTP and captcha text are single-use and must stay dynamic.
// -----------------------------------------------------------------------

import { chromium } from "playwright";
import { promptInput } from "./promptInput.mjs";
import { solveCaptcha } from "../lib/solveCaptcha.mjs";

const LOGIN_URL = "https://ewaybillgst.gov.in/"; // TODO: confirm exact login page URL

const SELECTORS = {
  username: "TODO", // e.g. '#username'
  password: "TODO", // e.g. '#password'
  captchaImage: "TODO", // e.g. '#captchaImage' or 'img[alt="captcha"]'
  captchaInput: "TODO", // e.g. '#captcha'
  loginSubmit: "TODO", // e.g. 'button:has-text("Login")'
  otpInput: "TODO", // e.g. '#otp'
  otpSubmit: "TODO", // e.g. 'button:has-text("Verify")'
  generateBulkMenuPath: [], // TODO: ['text=e-Waybill', 'text=Generate Bulk'] or similar, in click order
  fileInput: "TODO", // e.g. 'input[type="file"]'
};

const MAX_CAPTCHA_ATTEMPTS = 3;

async function loginWithAiCaptcha(page) {
  await page.goto(LOGIN_URL);
  await page.fill(SELECTORS.username, process.env.EWAY_PORTAL_USERNAME);
  await page.fill(SELECTORS.password, process.env.EWAY_PORTAL_PASSWORD);

  for (let attempt = 1; attempt <= MAX_CAPTCHA_ATTEMPTS; attempt++) {
    const captchaBuffer = await page.locator(SELECTORS.captchaImage).screenshot();
    const guess = await solveCaptcha(captchaBuffer);

    if (guess === "UNSURE") {
      console.log(`Captcha attempt ${attempt}: model was unsure, reloading captcha...`);
      // TODO: click whatever the portal's "refresh captcha" control is, then continue
      continue;
    }

    console.log(`Captcha attempt ${attempt}: trying "${guess}"`);
    await page.fill(SELECTORS.captchaInput, guess);
    await page.click(SELECTORS.loginSubmit);

    // TODO: replace with a real check -- e.g. did an error toast/element
    // appear, or did the URL/DOM change to the post-login state?
    const captchaWasWrong = await page
      .locator("text=/invalid captcha/i")
      .isVisible()
      .catch(() => false);

    if (!captchaWasWrong) {
      console.log("Captcha accepted.");
      return;
    }
    console.log("Captcha rejected by the portal, retrying...");
  }

  throw new Error(
    `Captcha not solved after ${MAX_CAPTCHA_ATTEMPTS} attempts. Stopping rather than ` +
      "risking a lockout from repeated failed logins."
  );
}

async function handleOtp(page) {
  // TODO: confirm the OTP field actually appears at this point, vs. e.g. a
  // separate page navigation you need to wait for first.
  await page.waitForSelector(SELECTORS.otpInput, { timeout: 60_000 });
  const otp = await promptInput("Enter the OTP sent to your phone/email: ");
  await page.fill(SELECTORS.otpInput, otp);
  await page.click(SELECTORS.otpSubmit);
  console.log("OTP submitted.");
}

async function navigateToGenerateBulk(page) {
  for (const step of SELECTORS.generateBulkMenuPath) {
    await page.click(step);
  }
  console.log("On the Generate Bulk page.");
}

async function attachBulkFile(page, jsonFilePath) {
  await page.setInputFiles(SELECTORS.fileInput, jsonFilePath);
  console.log(`Attached ${jsonFilePath}.`);
}

async function main() {
  const jsonFilePath = process.argv[2];
  if (!jsonFilePath) {
    console.error("Usage: node login-poc.mjs <path-to-bulk-json>");
    process.exit(1);
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("Set ANTHROPIC_API_KEY (for captcha solving).");
    process.exit(1);
  }
  if (!process.env.EWAY_PORTAL_USERNAME || !process.env.EWAY_PORTAL_PASSWORD) {
    console.error("Set EWAY_PORTAL_USERNAME and EWAY_PORTAL_PASSWORD.");
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: false }); // headed while proving this out
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await loginWithAiCaptcha(page);
    await handleOtp(page);
    await navigateToGenerateBulk(page);
    await attachBulkFile(page, jsonFilePath);

    // Proof, not submission: screenshot the filled-in state and stop here.
    // Nothing below this line exists. No submit button is ever clicked.
    await page.screenshot({ path: "poc-ready-to-submit.png", fullPage: true });
    console.log(
      "\nStopped one click before submission, as designed.\n" +
        "Check poc-ready-to-submit.png -- if it shows the file attached and " +
        "the form looking correct, the POC has proven the flow end to end.\n" +
        "The browser window is left open so you can look around by hand."
    );
  } catch (err) {
    await page.screenshot({ path: "poc-error.png", fullPage: true }).catch(() => {});
    console.error("POC failed:", err);
    console.error("See poc-error.png for the state at the point of failure.");
    process.exitCode = 1;
  }
  // Deliberately not closing the browser -- leaves it open for inspection.
  // Ctrl+C the script when you're done looking.
}

main();
