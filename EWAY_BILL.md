# E-way bill bulk export

Flags invoices that need a GST e-way bill and exports them as the portal's
bulk-upload JSON (e-Waybill → Generate Bulk). No paid API involved.

**Buyer setup (one time per buyer, ideally):** click **Fetch GST Info** in
the buyer's edit drawer's GST Info tab (preferred -- see "Two phases" below
for how this is wired up), or run `scripts/gstin-lookup` by hand. Bulk
upload needs PIN/state already correct in the file —
unlike the portal's single-bill "Generate New" form, which auto-fills them
from the buyer's GSTIN as you type, bulk processing does no live lookup and
just rejects a row with a missing/wrong one (confirmed against NIC's
`generate-eway-bill` API docs, which describe the same underlying generation
engine bulk upload uses). PIN/state are **not** manually editable and are
**not** stored on `Buyer` at all — they live only on the matching
`GstVerification` row (see below), and `BuyerDrawer`'s Details tab hides
those fields once a GSTIN is on file, pointing at the GST Info tab instead.
A buyer with no GSTIN (URP) isn't currently supported for e-way bill
generation at all — there's no automated source for their PIN/state and no
manual-entry path either, deliberately, until that workflow is asked for.

UI: on the invoice's own page (`/invoice/:id`), next to Download/Print — an
**E-way Bill** button appears for any invoice whose value puts it over the
threshold (see below), regardless of whether the buyer's GST info is
verified. It opens a small dialog: fill in vehicle no. / transporter GSTIN
if needed, and download the JSON for that one invoice. There's no separate
e-way-bill page or list — generation is per-invoice, from the invoice it's
for. (An earlier version had a standalone `/eway` list page for
bulk-selecting several invoices at once; removed in favor of this, since a
single invoice generated right after creation is the normal case.)

## Code (`src/eway/`)

Pure TypeScript with no React/DB dependency, so the same builder can feed a GSP
API later.

| File | Role |
| --- | --- |
| `codes.ts` | NIC code lists (states, units, doc/transport types), JSON version |
| `requirement.ts` | > ₹50,000 rule and per-state intra-state limits |
| `validate.ts` | pre-export checks (PIN/state, totals, HSN, units, dates, distance, Part-B) |
| `build.ts` | invoice → bulk entry, `dd/mm/yyyy` dates, text cleaning |
| `export.ts` | validate a batch, emit JSON for the bills that pass |
| `fromInvoice.ts` | app `Invoice` (+ `Buyer`) → `EwayInput` (discount spread over items, unit mapping) |
| `config.ts` | seller PIN code (190017, confirmed against a real accepted bill) |

Buyer ship-to PIN/state come from `latestGstVerification()` (`src/api/buyers.ts`)
— the newest `GstVerification` row whose `gstin` still matches the buyer's
current `gstin` (see above). `fromInvoice.ts`'s `buyerParty()` falls back to
guessing a PIN from the free-text address snapshot when that's unavailable
— good enough to flag "needs an e-way bill" but not reliable enough to
export without a warning (surfaced as a normal validation error in the
generation dialog on the invoice page).

Tests: `npm test`.

## Format source

Official files at docs.ewaybillgst.gov.in/html/formatdownload.html:
`EWB_Attributes_new.xlsx` (rules + master codes) and
`EWB_Preparation_Tool_new.xlsm` (what the portal's own tool writes). The
version string, field set and text/vehicle/HSN rules were read from those.

Known inconsistencies in the official files, and the choice made:

- Version: attributes header says `1.0.0621`, its sample says `1.0.1118`, the
  current Preparation Tool writes `1.0.0918`. We emit the tool's `1.0.0918`
  (`EWB_JSON_VERSION` in `codes.ts`).
- The tool omits `transType`/`subSupplyDesc`; so do we. The tool writes
  `hsnCode` as a number; the schema and newest sample say string; we write a string.
- Table 1 tax rates predate GST 2.0; 20% (CGST/SGST) and 40% (IGST) were added.

## Testing plan

1. Enter one real invoice in the portal's JSON Preparation Tool, generate JSON,
   and diff it against this export for the same invoice.
2. Optionally check payloads on a GSP sandbox (e.g. MasterGST).
3. First live upload with a real shipment. Rejected entries create nothing; a
   wrongly generated bill can be cancelled within 24 hours.

Already done once, informally: cross-checked the exporter's output against two
real e-way bills the user generated manually (a `CommonReport.xls` export from
the portal, matched read-only against prod to find the source invoices). This
is what confirmed the seller PIN and caught the `OthValue` rounding issue
above -- worth repeating against step 1's proper diff before the first bulk
upload, since this was informal and only checked two intra-state, single-HSN
bills.

**Not yet deployed:** the `GstVerification` table and its migrations this
feature depends on (see below) exist on this branch but haven't been applied
to prod yet -- confirmed by querying prod directly. Deploy + migrate before
relying on buyer ship-to data in production. The in-app "Fetch GST Info"
button also needs `gst-worker` actually running on the VPS and `GST_WORKER_URL`
/ `GST_WORKER_SECRET` set in Netlify's environment variables (see
`gst-worker/README.md`) -- without those, the button fails with a clear
"GST lookup isn't configured yet" error rather than silently doing nothing.

## Limits

- PIN → state uses prefix ranges, not NIC's PIN master; it catches clear
  mismatches only. Ambiguous prefixes accept any candidate state.
- Distance is always sent as `0`. NIC's `generate-eway-bill` API docs confirm
  this is a documented instruction meaning "use your own PIN-to-PIN distance",
  not a workaround — a non-zero distance is only accepted within ±10% of the
  portal's stored figure anyway (enforced in `validate.ts` if you ever pass a
  real one via `estimateDistanceKm`), so there's nothing to gain by estimating
  it ourselves. If the portal ever rejects 0 for a specific route (its distance
  database has no entry for that PIN pair), fix that one bill on the portal.
- Intra-state limits other than ₹50,000 come from secondary sources; verify.
- Not modelled: goods exempt from e-way bills; multiple invoices in one vehicle
  summing towards the limit.

## Two phases, only one adopted

Split deliberately into two pieces, and only the first is the actual plan:

1. **Generate the bulk-upload document** (this file, `src/eway/`, the E-way
   Bill button on each eligible invoice's page). The app produces the JSON;
   you upload it to the portal by hand. This is what's built and staying.
2. **Fully automate the portal** (login, captcha, OTP, submission) —
   deliberately **not** being pursued. `scripts/eway-poc/` is a
   proof-of-concept only, kept for reference: it proves login with an
   AI-solved captcha and a human-entered-OTP pause work technically, and
   stops one click before actual submission, but it's not integrated into
   the app and there's no plan to make it so. It automates past the
   captcha the portal puts there specifically to stop automation — a real
   (if low-probability) legal/ToS exposure that the rest of this file
   doesn't carry, since everything else here uses the portal as designed.

**One piece of automation is adopted, and it's neither of the above:**
looking a buyer's GSTIN up on the GST portal's free *public* Search Taxpayer
tool (no login, no OTP — a public registry lookup, not a filing action) and
inserting one `GstVerification` row with everything it returns, one time,
instead of typing it in by hand. It never writes to `Buyer` and never
touches the actual e-way bill portal or generates any compliance document.
Confirmed working end to end against the real page (2026-09-29, verified an
actual buyer on staging).

Two ways to run it, same underlying browser automation and captcha step:

- **In-app (phase 1.2, built):** the buyer edit drawer's GST Info tab has a
  **Fetch GST Info** button. Clicking it starts a session on `gst-worker/` —
  a small always-on process on a separate VPS, *not* a Netlify Function (a
  captcha needs a human to look at it and answer, which means the browser
  session has to stay open across two separate requests; Netlify Functions
  are stateless and can't do that — see `gst-worker/README.md`). The captcha
  image shows up right there in the drawer; you type what you see and submit.
  Deliberately a **human solves the captcha**, not an ML model — more
  reliable than the vision-based solving `scripts/gstin-lookup` used, which
  had a poor real-world hit rate against this portal's watermark-obscured
  images.
- **By hand:** `scripts/gstin-lookup/lookup-and-store.mjs` — the original
  script, still around for bulk sweeps (`--all-missing`) or as a fallback if
  `gst-worker` is down. Uses Claude's vision to solve the captcha instead of
  a human, via `--buyer <id>`. See the script's own README.

## GST verification is informational, not a gate

A buyer only counts as **verified** once `scripts/gstin-lookup` has
successfully confirmed their GSTIN against the government's own Search
Taxpayer data. There's no stored flag for this — `Buyer` doesn't cache any
GST-sourced field at all. "Verified" is derived at read time: a buyer is
verified if `latestGstVerification()` finds a `GstVerification` row whose
`gstin` still equals the buyer's current `gstin` (`isBuyerGstVerified` in
`src/api/buyers.ts`). Editing a buyer's GSTIN doesn't need to explicitly
un-verify anything — the old row's `gstin` simply stops matching, so it
self-heals with no invalidation code. Since PIN/state are no longer manually
editable once a buyer has a GSTIN (see above), verified now means exactly
what it says: the value came from the government lookup, full stop.

Verification status isn't shown as a standalone card — a niche, read-only
thing didn't deserve a full page row. It lives inside `BuyerDrawer` (the same
drawer used to create/edit a buyer), behind a **Details / GST Info** tab pair
that only appears once the buyer has a GSTIN. A "View GST Info" button on the
buyer detail page's Buyer Info card opens the drawer straight onto that tab;
"Edit" opens the same drawer onto Details instead — both the same component
and mode, just a different landing tab. Reusing the edit drawer was
deliberate, not just economical: the Fetch GST Info flow (see "Two phases"
above) lives in this exact surface, so that automation had somewhere to show
its result without needing a new UI built for it.

The GST Info tab shows legal/trade name (each its own line), registered
address, ship-to PIN/state, and the verified date, followed by several
independently-expandable accordion sections (Registration Details,
Jurisdiction, Business Activity, Goods & Services) rather than one big
"more details" panel — deliberately split so opening it doesn't dump
everything on screen at once (see `GstVerification` below for the full field
list). Doesn't appear on the buyer list, and doesn't block anything: **e-way
bill generation is available on any eligible invoice regardless of
verification status** — the only real gate is the invoice's own data being
valid (a missing PIN/state still shows up as a normal validation error in
the generation dialog, same as a bad HSN code would; it's just not treated
as a special "go verify this buyer" case anymore).

A verification is only valid for the GSTIN it was run against, so editing a
buyer's GSTIN un-verifies them (via the gstin-match check above, not an
explicit write) until `scripts/gstin-lookup` is re-run. That stays true even
though verification no longer gates anything, since a stale "verified" badge
showing GST details for the wrong GSTIN would be actively misleading on the
buyer page.
