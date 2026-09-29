# Buyer GST verification — one time per buyer

Looks a buyer's GSTIN up on the GST portal's free, public **Search
Taxpayer** tool (`services.gst.gov.in/services/searchtp` — no login, no OTP,
just a GSTIN and a captcha) and inserts one `GstVerification` row with
everything it returns. It never writes to `Buyer` — "verified" is derived at
read time by checking whether a `GstVerification` row's `gstin` still
matches the buyer's current `gstin` (`isBuyerGstVerified` in
`src/api/buyers.ts`). Shown in the same drawer used to create/edit a buyer
("View GST Info" on the buyer detail page opens it); informational only,
doesn't gate e-way bill generation — see [EWAY_BILL.md](../../EWAY_BILL.md).

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

## Status

Selectors confirmed working against the real page (2026-09-29/30) — see the
comment block at the top of `lookup-and-store.mjs` for the two non-obvious
things found running it live (the captcha only appears on real keystrokes,
not `.fill()`; a watermark occasionally obscures a character, handled by the
retry+refresh loop already in place). First real run verified an actual
buyer (`Raheek Multinational Sarai`, GSTIN `01CHMPB4308R1ZA`) against
staging; its full detail (jurisdiction, business activity, HSN/SAC goods it
deals in) was backfilled into `GstVerification` by hand from that same
session, since the table didn't exist yet when the lookup ran -- every
lookup from here on writes it automatically. If the portal changes its
markup and this starts failing, redo the affected selector by hand
(`headless: false` temporarily, or screenshot each step) rather than
guessing.

## Setup

`playwright` is now a project devDependency (`npm install` picks it up) plus
`@anthropic-ai/sdk` for captcha solving — install that one yourself if you
haven't already — and `pg`, which the app already depends on. Set
`ANTHROPIC_API_KEY` in `.env`. Also run `npx playwright install chromium`
once, to fetch the browser binary.

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
with the PIN and state it found for anything it wrote).

## What it writes

Only `GstVerification` — one new row per successful lookup, never
overwritten (a history table, not a cache): `pincode`, `stateCode`,
`legalName`, `tradeName`, `registrationDate`, `constitutionOfBusiness`,
`gstinStatus`, `taxpayerType`, `principalAddress`, and a `raw` JSON blob
holding the rest of what the portal shows that isn't worth its own typed
column — jurisdiction (administrative + state office), nature of core
business activity, nature of business activities, the HSN/SAC goods &
services table, and a full plain-text dump of the results panel as a
catch-all. Not surfaced in full in the UI yet; query the table directly if
you need it.

`Buyer` itself is never written to by this script. Buyer ship-to PIN/state
for a GSTIN buyer always come from the latest matching `GstVerification`
row via `latestGstVerification()` (`src/api/buyers.ts`), never cached back
onto `Buyer` — see [EWAY_BILL.md](../../EWAY_BILL.md).

**Never** `Buyer.name` or `Buyer.address`, even though the portal also
returns a legal/trade name and a full address that could fill those.
Deliberate: your working `name`/`address` might intentionally differ from
GST's registered legal name (how you refer to a customer isn't necessarily
their GST paperwork name), so this only surfaces the official values
(console output, and the `GstVerification` row) for you to compare, rather
than silently overwriting what you're already using. Say so if you'd rather
it did.

A verification is only valid for the GSTIN it ran against. There's no flag
to clear when a buyer's GSTIN changes — the old `GstVerification` row's
`gstin` simply stops matching the buyer's new one, so `isBuyerGstVerified`
naturally goes false and no stale "verified" badge lingers under a changed
GSTIN. Re-run this script to re-verify.

## Known gaps

- No session/rate-limit awareness — if the public tool starts throttling or
  captcha-walling after N lookups in a row, this doesn't detect or back off
  from that beyond the fixed 4s gap between buyers.
- The extra fields feeding `GstVerification` (jurisdiction lines, nature of
  business activity, the goods/services HSN table, `fieldByLabel`'s switch to
  `:has-text()`) were built against the real saved HTML from the 2026-09-29
  session, not re-run live afterward — high confidence since it's the actual
  markup, but the *next* run is the first live exercise of that code path.
  Check its output against what the portal shows for that GSTIN the first
  time.
- The automated captcha-solving path (`solveCaptcha.mjs` calling Claude via
  `@anthropic-ai/sdk`) hasn't been run end-to-end yet — the live verification
  above was done by reading each captcha screenshot directly rather than
  through that API call (no `ANTHROPIC_API_KEY` in that environment). The
  selectors, form flow, and result parsing are all confirmed against the real
  page; only the model-reads-the-image step itself is still unproven in
  practice, though there's no reason to expect it to perform differently.
