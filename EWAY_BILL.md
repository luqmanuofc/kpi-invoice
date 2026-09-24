# E-way bill bulk export

Flags invoices that need a GST e-way bill and exports them as the portal's
bulk-upload JSON (e-Waybill → Generate Bulk). No paid API involved.

UI: **E-way Bills** (`/eway`). Pick a date range, fill in what the invoice
doesn't hold (buyer PIN, distance, vehicle, transporter), tick the bills that
show **Ready**, and download the JSON.

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
| `fromInvoice.ts` | app `Invoice` → `EwayInput` (discount spread over items, unit mapping) |
| `config.ts` | **seller PIN code — must be set before any bill will validate** |

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
- The portal's PIN-to-PIN distance isn't available offline. Leave distance `0`
  (the official tool does this too) to let the portal calculate it, or pass
  `estimateDistanceKm` to `validateEwayInput` from a distance source.
- Intra-state limits other than ₹50,000 come from secondary sources; verify.
- Not modelled: goods exempt from e-way bills; multiple invoices in one vehicle
  summing towards the limit.
