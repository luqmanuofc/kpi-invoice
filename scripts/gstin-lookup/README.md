# Buyer GST verification — one time per buyer

Looks a buyer's GSTIN up on the GST portal's free, public **Search
Taxpayer** tool (`services.gst.gov.in/services/searchtp` — no login, no OTP,
just a GSTIN and a captcha), stores the resulting PIN code and state code on
that buyer's row, and marks the buyer **verified** (`gstVerifiedAt`). The
E-way Bills page only offers bulk-JSON generation for verified buyers — see
[EWAY_BILL.md](../../EWAY_BILL.md).

This is currently phase 1 of a planned two-phase rollout: right now,
verification only happens by running this script by hand (`--buyer` or
`--all-missing`). Phase 1.2 (not built) would trigger it automatically from
the app the moment a GSTIN is entered on the buyer form.

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

or, to sweep every buyer with a GSTIN that isn't verified yet:

```
node -r dotenv/config scripts/gstin-lookup/lookup-and-store.mjs --all-missing
```

Prints a per-buyer summary table at the end (verified / skipped / failed,
with the before → after PIN and state for anything it wrote).

## What it writes

`Buyer.pincode`, `Buyer.stateCode`, `Buyer.gstVerifiedAt` (set to the time of
the successful lookup — this is what "verified" means), and the raw values
the portal returned for reference: `Buyer.gstLegalName`, `Buyer.gstTradeName`,
`Buyer.gstAddress`.

**Never** `Buyer.name` or `Buyer.address`, even though the portal also
returns a legal/trade name and a full address that could fill those.
Deliberate: your working `name`/`address` might intentionally differ from
GST's registered legal name (how you refer to a customer isn't necessarily
their GST paperwork name), so this only surfaces the official values
(console output, and now `gstLegalName`/`gstAddress` on the row) for you to
compare, rather than silently overwriting what you're already using. Say so
if you'd rather it did.

A verification is only valid for the GSTIN it ran against —
`netlify/functions/updateBuyer.ts` clears `gstVerifiedAt` automatically if
you edit a buyer's GSTIN afterward, so a stale "verified" badge never lingers
under a changed GSTIN. Re-run this script to re-verify.

## Known gaps

- No session/rate-limit awareness — if the public tool starts throttling or
  captcha-walling after N lookups in a row, this doesn't detect or back off
  from that beyond the fixed 4s gap between buyers.
- Same caveat as `eway-poc`: the "captcha was wrong" check assumes specific
  error text that hasn't been confirmed against the real page.
