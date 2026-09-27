# E-way bill bulk export

Flags invoices that need a GST e-way bill and exports them as the portal's
bulk-upload JSON (e-Waybill → Generate Bulk). No paid API involved.

**Buyer setup (one time per buyer):** open the buyer's Edit form and fill in
"Ship-to PIN code" and "Ship-to state". Bulk upload needs these already correct
in the file — unlike the portal's single-bill "Generate New" form, which
auto-fills them from the buyer's GSTIN as you type, bulk processing does no
live lookup and just rejects a row with a missing/wrong one (confirmed against
NIC's `generate-eway-bill` API docs, which describe the same underlying
generation engine bulk upload uses). So this is entered once here instead.

UI: **E-way Bills** (`/eway`). Pick a date range, fill in the vehicle number
and transporter GSTIN if needed, tick the bills that show **Ready**, and
download the JSON.

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
| `config.ts` | **seller PIN code — must be set before any bill will validate** |

Buyer ship-to PIN/state live on the `Buyer` model (`pincode`, `stateCode`),
entered via `BuyerDrawer`. For a buyer without them set yet, `fromInvoice.ts`
falls back to guessing a PIN from the free-text address snapshot — good enough
to flag "needs an e-way bill" but not reliable enough to export without a
warning, so the E-way Bills page also lists which buyers are missing them.

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
