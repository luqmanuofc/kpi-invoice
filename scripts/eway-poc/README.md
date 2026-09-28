# E-way bill portal automation — POC only

Proves the three uncertain pieces of the "automate the portal" idea end to
end, without ever submitting anything real:

1. Log in with an AI-solved captcha
2. Pause and take a human-typed OTP
3. Navigate to Generate Bulk and attach the bulk JSON

It stops one click before "Upload and Generate" and screenshots the filled-in
state as proof, instead of submitting. See the top of `login-poc.mjs` and
[EWAY_BILL.md](../../EWAY_BILL.md) for the fuller reasoning — this exists to
test feasibility, not as something to run unattended or deploy.

**This is not integrated into the app, and isn't meant to be run repeatedly
against your real login until you've decided you actually want this.** Every
run is a real login attempt against the real portal.

## Before running

The selectors in `login-poc.mjs` are all placeholders (`"TODO"`) — this has
never touched the real portal, so there was nothing to test them against.
Fill them in yourself:

```
npx playwright codegen https://ewaybillgst.gov.in
```

Log in by hand in the window that opens (real captcha, real OTP — this step
still needs you). Playwright records each click/fill and prints the selector
it used. Copy the ones for: username field, password field, the captcha
`<img>`, the captcha input, the login button, the OTP input, the OTP submit
button, the "e-Waybill → Generate Bulk" menu clicks in order, and the file
input on that page. Paste them into the `SELECTORS` object in
`login-poc.mjs`. Leave out codegen's *recorded values* for the captcha text
and OTP — those are single-use and must stay dynamic, which is the whole
point of this script.

## Setup

```
npm install --save-dev playwright @anthropic-ai/sdk
npx playwright install chromium
```

Set in `.env` (or export directly — this script uses `dotenv/config` like the
other `scripts/` folders):

```
ANTHROPIC_API_KEY=...
EWAY_PORTAL_USERNAME=...
EWAY_PORTAL_PASSWORD=...
```

## Run

```
node -r dotenv/config scripts/eway-poc/login-poc.mjs path/to/bulk.json
```

Use a JSON file from the app's E-way Bills export, or the sample from NIC's
own `EWB_JSON.json` for a first try.

## What "proof" looks like

- `poc-ready-to-submit.png` — the Generate Bulk page with your file attached,
  right before the point of no return. If this looks correct, the automation
  works end to end.
- `poc-error.png` — written instead if something failed partway, so you can
  see exactly where.
- The browser window is left open at the end (or on failure) for you to poke
  around by hand before closing it.

## Known gaps (POC, not production)

- No session persistence (`storageState`) — every run does a full login.
  Worth adding once selectors are confirmed, since it'd remove the OTP step
  on same-day repeat runs.
- Captcha retry logic assumes a specific "invalid captcha" error text that
  hasn't been confirmed against the real portal — check `poc-error.png` if a
  run throws instead of retrying as expected, and fix the check in
  `loginWithAiCaptcha`.
- No results scraping yet (this stops before there'd be anything to scrape).
