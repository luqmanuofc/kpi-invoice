# Buyer PIN/state lookup — one time per buyer

Looks a buyer's GSTIN up on the GST portal's free, public **Search
Taxpayer** tool (`services.gst.gov.in/services/searchtp` — no login, no OTP,
just a GSTIN and a captcha) and stores the resulting PIN code and state code
on that buyer's row, so the E-way Bills page stops asking for them.

This is deliberately narrower than `scripts/eway-poc/`: it only reads public
registry data and only writes to our own database. It never touches the
e-way bill portal itself, and the bulk-JSON export/upload flow (the thing
that actually generates compliance documents) is untouched either way — see
[EWAY_BILL.md](../../EWAY_BILL.md) for how the two fit together.

Same captcha-solving approach as `eway-poc` (screenshot the `<img>`, ask
Claude to read it, retry up to 3 times) — see
[`../lib/solveCaptcha.mjs`](../lib/solveCaptcha.mjs), shared by both.

## Before running

Selectors in `lookup-and-store.mjs` are placeholders — capture the real ones:

```
npx playwright codegen https://services.gst.gov.in/services/searchtp
```

Type in a real GSTIN, solve the captcha, submit, and copy the selectors for
the GSTIN input, the captcha image, the captcha input, the submit button,
and the result fields (legal/trade name, principal place of business
address, and — if they're shown as their own fields rather than embedded in
the address — state and PIN code separately). Paste them into `SELECTORS`.

## Setup

Same dependencies as `eway-poc` (`playwright`, `@anthropic-ai/sdk` — install
those first if you haven't already) plus `pg`, which the app already
depends on. Set `ANTHROPIC_API_KEY` in `.env`.

## Run

From the project root, so it picks up `.env` (including `DATABASE_URL` —
**whatever that currently points to gets written to**; it's staging right
now, not prod):

```
node -r dotenv/config scripts/gstin-lookup/lookup-and-store.mjs --buyer <buyerId>
```

or, to sweep every buyer that has a GSTIN but no PIN/state yet:

```
node -r dotenv/config scripts/gstin-lookup/lookup-and-store.mjs --all-missing
```

Prints a per-buyer summary table at the end (saved / skipped / failed, with
the before → after PIN and state for anything it wrote).

## What it writes

Only `Buyer.pincode` and `Buyer.stateCode` — never `name` or `address`, even
though the portal also returns a legal/trade name and a full address.
Deliberate: those are printed to the console for you to eyeball, but not
written automatically, since your `Buyer.name`/`address` might intentionally
differ from GST's registered legal name (how you refer to a customer isn't
necessarily their GST paperwork name) and overwriting them silently seemed
like the wrong default. Say so if you'd rather it did.

## Known gaps

- No session/rate-limit awareness — if the public tool starts throttling or
  captcha-walling after N lookups in a row, this doesn't detect or back off
  from that beyond the fixed 4s gap between buyers.
- Same caveat as `eway-poc`: the "captcha was wrong" check assumes specific
  error text that hasn't been confirmed against the real page.
