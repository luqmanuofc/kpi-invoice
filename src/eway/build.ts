import {
  DOC_TYPE,
  EWB_JSON_VERSION,
  SUB_SUPPLY_TYPE,
  SUPPLY_TYPE,
  toNicUnit,
} from "./codes";
import { normalizeVehicleNo } from "./gst";
import type { EwayBill, EwayBulkFile, EwayInput } from "./types";

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** YYYY-MM-DD (optionally followed by a time) -> dd/mm/yyyy. "" if unparseable. */
export function toPortalDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? "");
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "";
}

// The portal only accepts A-Z a-z 0-9 space @ # - / , & . in text fields.
// Replace anything else with a space and collapse runs.
export function cleanText(s: string, max: number): string {
  return s
    .replace(/[^A-Za-z0-9 @#\-/,&.]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

/** Build one bulk-upload entry (outward supply against a tax invoice). */
export function buildEwayBill(input: EwayInput): EwayBill {
  const { from, to, transport: t } = input;
  const items = input.items.map((it, i) => ({
    itemNo: i + 1,
    productName: cleanText(it.description, 100),
    productDesc: cleanText(it.description, 100),
    hsnCode: it.hsn.trim(),
    quantity: it.qty,
    qtyUnit: toNicUnit(it.unit) ?? it.unit.trim().toUpperCase(),
    taxableAmount: round2(it.taxableAmount),
    sgstRate: input.sgstRate,
    cgstRate: input.cgstRate,
    igstRate: input.igstRate,
    cessRate: 0,
    cessNonAdvol: 0,
  }));
  const mainItem = items.reduce((a, b) => (b.taxableAmount > a.taxableAmount ? b : a), items[0]);

  const totalValue = round2(items.reduce((s, i) => s + i.taxableAmount, 0));
  const cgstValue = round2(input.cgstValue);
  const sgstValue = round2(input.sgstValue);
  const igstValue = round2(input.igstValue);
  const totInvValue = round2(input.totInvValue);
  // The invoice's own total is rounded to the nearest rupee, so it rarely
  // equals taxable + tax to the paisa. Real accepted bills close that gap in
  // OthValue (confirmed against actual EWB records: e.g. -0.40 on a bill whose
  // taxable + tax was 68121.40 against a total of 68121), so we do the same
  // instead of leaving totInvValue slightly off.
  const OthValue = round2(totInvValue - (totalValue + cgstValue + sgstValue + igstValue));

  return {
    userGstin: input.userGstin,
    supplyType: SUPPLY_TYPE.OUTWARD,
    subSupplyType: SUB_SUPPLY_TYPE.SUPPLY,
    docType: DOC_TYPE.TAX_INVOICE,
    docNo: input.docNo.trim(),
    docDate: toPortalDate(input.docDate),
    fromGstin: from.gstin,
    fromTrdName: cleanText(from.name, 100),
    fromAddr1: cleanText(from.address1, 120),
    fromAddr2: cleanText(from.address2, 120),
    fromPlace: cleanText(from.place, 50),
    fromPincode: from.pincode ?? 0,
    fromStateCode: from.stateCode ?? 0,
    actualFromStateCode: from.actualStateCode ?? from.stateCode ?? 0,
    toGstin: to.gstin,
    toTrdName: cleanText(to.name, 100),
    toAddr1: cleanText(to.address1, 120),
    toAddr2: cleanText(to.address2, 120),
    toPlace: cleanText(to.place, 50),
    toPincode: to.pincode ?? 0,
    toStateCode: to.stateCode ?? 0,
    actualToStateCode: to.actualStateCode ?? to.stateCode ?? 0,
    totalValue,
    cgstValue,
    sgstValue,
    igstValue,
    cessValue: 0,
    TotNonAdvolVal: 0,
    OthValue,
    totInvValue,
    transMode: t.mode,
    transDistance: t.distanceKm,
    transporterName: cleanText(t.transporterName, 25),
    transporterId: t.transporterId.trim().toUpperCase(),
    transDocNo: t.transDocNo.trim(),
    transDocDate: toPortalDate(t.transDocDate),
    vehicleNo: normalizeVehicleNo(t.vehicleNo),
    vehicleType: t.vehicleType,
    mainHsnCode: mainItem.hsnCode,
    itemList: items,
  };
}

export function buildBulkFile(bills: EwayBill[]): EwayBulkFile {
  return { version: EWB_JSON_VERSION, billLists: bills };
}

export function serializeBulkFile(file: EwayBulkFile): string {
  return JSON.stringify(file, null, 2);
}
