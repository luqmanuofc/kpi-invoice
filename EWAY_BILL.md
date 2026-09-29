# E-way bill bulk export

Flags invoices that need a GST e-way bill and exports them as the portal's
bulk-upload JSON (e-Waybill → Generate Bulk). No paid API involved.

**Buyer setup (one time per buyer, ideally):** run `scripts/gstin-lookup`
(preferred). Bulk upload needs PIN/state already correct in the file —
unlike the portal's single-bill "Generate New" form, which auto-fills them
from the buyer's GSTIN as you type, bulk processing does no live lookup and
just rejects a row with a missing/wrong one (confirmed against NIC's
`generate-eway-bill` API docs, which describe the same underlying generation
engine bulk upload uses). For a buyer with a GSTIN, PIN/state are **not**
manually editable and are **not** stored on `Buyer` at all — they live only
on the matching `GstVerification` row (see below), and `BuyerDrawer`'s
Details tab hides those fields once a GSTIN is on file, pointing at the GST
Info tab instead. A buyer with no GSTIN (URP) has no GST Info tab at all, so
`Buyer.pincode`/`Buyer.stateCode` stay manually editable on Details — that's
the one case those columns are still for, since there's no automated source
for them.

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
for a GSTIN buyer — the newest `GstVerification` row whose `gstin` still
matches the buyer's current `gstin` — or from `Buyer.pincode`/`stateCode`
directly for a URP buyer (see above). `fromInvoice.ts`'s `buyerParty()`
resolves them in that order and falls back to guessing a PIN from the
free-text address snapshot when neither is available — good enough to flag
"needs an e-way bill" but not reliable enough to export without a warning
(surfaced as a normal validation error in the generation dialog on the
invoice page).

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

**Not yet deployed:** the `pincode`/`stateCode` columns this feature depends on
(see below) exist on this branch's migration but haven't been applied to prod
yet -- confirmed by querying prod's `Buyer` table directly. Deploy + migrate
before relying on buyer ship-to data in production.

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
`scripts/gstin-lookup/` looks a buyer's GSTIN up on the GST portal's free
*public* Search Taxpayer tool (no login, no OTP — a public registry lookup,
not a filing action) and inserts one `GstVerification` row with everything it
returns, one time, instead of typing it in by hand. It never writes to
`Buyer` and never touches the actual e-way bill portal or generates any
compliance document — see the script's own README. Confirmed working end to
end against the real page (2026-09-29, verified an actual buyer on staging).

Phase 1.2 (not built): trigger that lookup automatically from the app the
moment a GSTIN is entered on the buyer form, instead of running the script
by hand. For now, verification is a manual, deliberate step.

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
and mode, just a different landing tab. Reusing the edit drawer is
deliberate, not just economical: phase 1.2 (auto-running the lookup the
moment a GSTIN is typed in) lands in this same surface later, so building the
display here now means that automation has somewhere to show its result
without a new UI.

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
