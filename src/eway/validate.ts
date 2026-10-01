import {
  ADDRESS_CHARS,
  DOC_NO_CHARS,
  MAX_DISTANCE_KM,
  STANDARD_CGST_SGST_RATES,
  STANDARD_IGST_RATES,
  STATE_CODES,
  TRANS_MODE,
  UNIT_CODES,
  toNicUnit,
} from "./codes";
import { isValidGstin, isValidVehicleNo, stateCodeFromGstin, URP } from "./gst";
import { isValidPincodeFormat, pincodeMatchesState, statesForPincode } from "./pincode";
import { round2 } from "./build";
import type { EwayBill, EwayInput, EwayIssue, EwayParty } from "./types";

// Max mismatch (Rs) between summed parts and the invoice total. The invoice
// total is rounded to a whole rupee (<= 0.5 off); the portal itself tolerates 2.
export const TOTAL_TOLERANCE = 1;
// Max per-invoice difference between stated tax and taxable x rate.
export const TAX_TOLERANCE = 1;
// Confirmed in NIC's e-way bill generation API docs (generate-eway-bill.html):
// a non-zero distance is only accepted within +-10% of the portal's own
// PIN-to-PIN distance (or, when that stored distance is under 100km, within
// +10% of it). Passing 0 instead means "use the portal's own distance" and is
// always accepted, which is why the app never sends a non-zero distance.
export const DISTANCE_TOLERANCE = 0.1;
// Same rule: if fromPincode === toPincode, distance can't exceed this (300 for
// Line Sales, not modelled here since this app only builds outward-supply bills).
export const MAX_SAME_PINCODE_DISTANCE_KM = 100;
export const MAX_ITEMS_PER_BILL = 250;

export interface ValidateOptions {
  /** "Today" as YYYY-MM-DD, for the doc-date-not-in-future rule. */
  today: string;
  /**
   * The portal's PIN-to-PIN distance in km, if you have a source for it (a GSP
   * distance API, or a cached value keyed by PIN pair). Without it the
   * distance check is limited to the 0..4000 range.
   */
  estimateDistanceKm?: (fromPincode: number, toPincode: number) => number | undefined;
}

const err = (field: string, message: string): EwayIssue => ({ severity: "error", field, message });
const warn = (field: string, message: string): EwayIssue => ({ severity: "warning", field, message });
const info = (field: string, message: string): EwayIssue => ({ severity: "info", field, message });

const isRealDate = (iso: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
};

function checkParty(side: "from" | "to", p: EwayParty, out: EwayIssue[]) {
  const f = (name: string) => `${side}.${name}`;
  const isUrp = p.gstin === URP;

  if (!isUrp && !isValidGstin(p.gstin)) out.push(err(f("gstin"), `Invalid GSTIN "${p.gstin}" (use URP for an unregistered party)`));

  if (p.stateCode === null || !(p.stateCode in STATE_CODES)) {
    out.push(err(f("stateCode"), "Missing or unknown state code"));
  } else if (!isUrp) {
    const fromGstin = stateCodeFromGstin(p.gstin);
    if (fromGstin !== null && fromGstin !== p.stateCode) {
      out.push(err(f("stateCode"), `State ${p.stateCode} does not match GSTIN prefix (${fromGstin})`));
    }
  }

  const actual = p.actualStateCode ?? p.stateCode;
  if (actual !== null && !(actual in STATE_CODES)) out.push(err(f("actualStateCode"), `Unknown state code ${actual}`));

  if (p.pincode === null || !isValidPincodeFormat(p.pincode)) {
    out.push(err(f("pincode"), "Missing or invalid PIN code (need 6 digits, not starting with 0)"));
  } else if (actual !== null) {
    const match = pincodeMatchesState(p.pincode, actual);
    if (match === false) {
      const states = (statesForPincode(p.pincode) ?? []).map((c) => `${c} ${STATE_CODES[c] ?? ""}`.trim());
      out.push(err(f("pincode"), `PIN ${p.pincode} does not belong to state ${actual} (${STATE_CODES[actual] ?? "?"}); expected ${states.join(" / ")}`));
    } else if (match === null) {
      out.push(warn(f("pincode"), `PIN ${p.pincode} could not be checked against state ${actual}`));
    }
  }

  for (const [name, value, max] of [
    ["name", p.name, 100],
    ["address1", p.address1, 120],
    ["address2", p.address2, 120],
    ["place", p.place, 50],
  ] as const) {
    if (!ADDRESS_CHARS.test(value)) out.push(warn(f(name), "Contains characters the portal rejects; they will be replaced with spaces"));
    if (value.length > max) out.push(warn(f(name), `Longer than ${max} characters; it will be truncated`));
  }
  if (!p.address1.trim()) out.push(warn(f("address1"), "Address is empty"));
}

/** Semantic checks on an invoice before it is turned into a bill. */
export function validateEwayInput(input: EwayInput, opts: ValidateOptions): EwayIssue[] {
  const out: EwayIssue[] = [];

  // Identity
  if (!isValidGstin(input.userGstin)) out.push(err("userGstin", "Invalid user GSTIN"));
  if (input.from.gstin !== input.userGstin) out.push(err("from.gstin", "For an outward bill the consignor GSTIN must be the logged-in GSTIN"));

  // Document
  const docNo = input.docNo.trim();
  if (!docNo) out.push(err("docNo", "Document number is required"));
  else {
    if (docNo.length > 16) out.push(err("docNo", `Document number is ${docNo.length} characters; the portal allows 16`));
    if (!DOC_NO_CHARS.test(docNo)) out.push(err("docNo", "Document number may only use letters, digits, space, - / ."));
  }
  if (!isRealDate(input.docDate.slice(0, 10))) out.push(err("docDate", `Document date "${input.docDate}" is not a valid date`));
  else if (input.docDate.slice(0, 10) > opts.today) out.push(err("docDate", "Document date is in the future"));

  checkParty("from", input.from, out);
  checkParty("to", input.to, out);

  // Tax structure: intra-state -> CGST+SGST, inter-state -> IGST.
  const { from, to } = input;
  const sameState = from.stateCode !== null && from.stateCode === to.stateCode;
  if (from.stateCode !== null && to.stateCode !== null) {
    if (sameState) {
      if (input.igstRate !== 0 || input.igstValue !== 0) out.push(err("igst", "Intra-state supply must not carry IGST"));
      if (input.cgstRate !== input.sgstRate) out.push(err("cgstRate", "CGST and SGST rates differ"));
    } else if (input.cgstRate !== 0 || input.sgstRate !== 0 || input.cgstValue !== 0 || input.sgstValue !== 0) {
      out.push(err("cgst", "Inter-state supply must carry IGST only, not CGST/SGST"));
    }
  }
  for (const [name, rate, list] of [
    ["cgstRate", input.cgstRate, STANDARD_CGST_SGST_RATES],
    ["sgstRate", input.sgstRate, STANDARD_CGST_SGST_RATES],
    ["igstRate", input.igstRate, STANDARD_IGST_RATES],
  ] as const) {
    if (!list.includes(rate)) out.push(warn(name, `Rate ${rate}% is not in the portal's standard rate list`));
  }

  // Items
  if (input.items.length === 0) out.push(err("items", "No items"));
  if (input.items.length > MAX_ITEMS_PER_BILL) out.push(err("items", `${input.items.length} items; the portal allows ${MAX_ITEMS_PER_BILL} per bill`));
  input.items.forEach((it, i) => {
    const f = (n: string) => `items[${i + 1}].${n}`;
    if (!/^(\d{4}|\d{6}|\d{8})$/.test(it.hsn.trim())) out.push(err(f("hsn"), `HSN "${it.hsn}" must be 4, 6 or 8 digits`));
    const unit = toNicUnit(it.unit);
    if (!unit) out.push(err(f("unit"), `Unit "${it.unit}" has no NIC unit code (e.g. NOS, KGS, PCS, BDL)`));
    else if (!(unit in UNIT_CODES)) out.push(err(f("unit"), `Unit "${unit}" is not in the portal's unit list`));
    if (!(it.qty > 0)) out.push(err(f("qty"), "Quantity must be positive"));
    if (!(it.taxableAmount >= 0)) out.push(err(f("taxableAmount"), "Taxable amount is negative"));
    if (!it.description.trim()) out.push(warn(f("description"), "Product name is empty"));
    else if (!ADDRESS_CHARS.test(it.description)) out.push(warn(f("description"), "Contains characters the portal rejects; they will be replaced with spaces"));
  });

  // Totals
  const taxable = input.items.reduce((s, i) => s + i.taxableAmount, 0);
  const expectTax = (name: string, rate: number, stated: number) => {
    const expected = (taxable * rate) / 100;
    if (Math.abs(expected - stated) > TAX_TOLERANCE) {
      out.push(err(name, `Stated ${round2(stated)} but taxable ${round2(taxable)} x ${rate}% = ${round2(expected)}`));
    }
  };
  expectTax("cgstValue", input.cgstRate, input.cgstValue);
  expectTax("sgstValue", input.sgstRate, input.sgstValue);
  expectTax("igstValue", input.igstRate, input.igstValue);
  const sum = taxable + input.cgstValue + input.sgstValue + input.igstValue;
  if (Math.abs(sum - input.totInvValue) > TOTAL_TOLERANCE) {
    out.push(err("totInvValue", `Taxable + taxes = ${round2(sum)} but invoice total is ${round2(input.totInvValue)}`));
  }

  // Transport (Part-B)
  const t = input.transport;
  if (!Object.values(TRANS_MODE).includes(t.mode)) out.push(err("transport.mode", "Invalid transport mode"));
  if (!Number.isInteger(t.distanceKm) || t.distanceKm < 0 || t.distanceKm > MAX_DISTANCE_KM) {
    out.push(err("transport.distanceKm", `Distance must be a whole number from 0 to ${MAX_DISTANCE_KM}`));
  } else if (t.distanceKm === 0) {
    out.push(info("transport.distanceKm", "Distance 0: the portal calculates it from the PIN codes"));
  } else if (from.pincode && to.pincode && from.pincode === to.pincode && t.distanceKm > MAX_SAME_PINCODE_DISTANCE_KM) {
    out.push(err("transport.distanceKm", `Same PIN code on both ends: distance can't exceed ${MAX_SAME_PINCODE_DISTANCE_KM} km`));
  } else if (opts.estimateDistanceKm && from.pincode && to.pincode) {
    const est = opts.estimateDistanceKm(from.pincode, to.pincode);
    if (est !== undefined && est > 0) {
      if (t.distanceKm > est * (1 + DISTANCE_TOLERANCE)) {
        out.push(err("transport.distanceKm", `Distance ${t.distanceKm} km is more than ${DISTANCE_TOLERANCE * 100}% above the PIN-to-PIN estimate of ${est} km`));
      } else if (t.distanceKm < est * 0.5) {
        out.push(warn("transport.distanceKm", `Distance ${t.distanceKm} km is far below the PIN-to-PIN estimate of ${est} km`));
      }
    }
  }
  if (t.mode === TRANS_MODE.ROAD) {
    if (!t.vehicleNo.trim() && !t.transporterId.trim()) out.push(err("transport.vehicleNo", "Road transport needs a vehicle number or a transporter ID"));
    if (t.vehicleNo.trim() && !isValidVehicleNo(t.vehicleNo)) out.push(err("transport.vehicleNo", `Vehicle number "${t.vehicleNo}" is not in a format the portal accepts`));
    if (!t.transDocDate) out.push(err("transport.transDocDate", "The portal's tool requires a transport date for road transport"));
  } else {
    if (!t.transDocNo.trim() || !t.transDocDate) out.push(err("transport.transDocNo", "Rail/air/ship needs a transport document number and date"));
    if (t.vehicleType !== "R" && t.mode !== TRANS_MODE.SHIP) out.push(err("transport.vehicleType", "Rail/air must use vehicle type Regular"));
  }
  if (t.transporterId.trim() && !isValidGstin(t.transporterId.trim().toUpperCase())) {
    out.push(err("transport.transporterId", "Transporter ID is not a valid GSTIN"));
  }
  if (t.transDocDate) {
    if (!isRealDate(t.transDocDate)) out.push(err("transport.transDocDate", "Transport date is not a valid date"));
    else {
      if (t.transDocDate > opts.today) out.push(err("transport.transDocDate", "Transport date is in the future"));
      if (t.transDocDate < input.docDate.slice(0, 10)) out.push(err("transport.transDocDate", "Transport date is before the document date"));
    }
  }

  return out;
}

const DATE_RE = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/(19|20)[0-9]{2}$/;

/** Format checks on the finished bill, mirroring the official JSON schema. */
export function validateEwayBill(b: EwayBill): EwayIssue[] {
  const out: EwayIssue[] = [];
  const need = (ok: boolean, field: string, msg: string) => ok || out.push(err(field, msg));
  const money = (n: number) => Number.isFinite(n) && Math.abs(Math.round(n * 100) - n * 100) < 1e-6;

  need(DATE_RE.test(b.docDate), "docDate", `"${b.docDate}" is not dd/mm/yyyy`);
  need(b.transDocDate === "" || DATE_RE.test(b.transDocDate), "transDocDate", `"${b.transDocDate}" is not dd/mm/yyyy`);
  need(b.docNo.length > 0 && b.docNo.length <= 16, "docNo", "Document number must be 1-16 characters");
  need(isValidPincodeFormat(b.fromPincode), "fromPincode", "Invalid PIN code");
  need(isValidPincodeFormat(b.toPincode), "toPincode", "Invalid PIN code");
  for (const k of ["fromStateCode", "actualFromStateCode", "toStateCode", "actualToStateCode"] as const) {
    need(b[k] in STATE_CODES, k, `Unknown state code ${b[k]}`);
  }
  need(Number.isInteger(b.transDistance) && b.transDistance >= 0 && b.transDistance <= MAX_DISTANCE_KM, "transDistance", "Distance out of range");
  for (const k of ["totalValue", "cgstValue", "sgstValue", "igstValue", "totInvValue"] as const) {
    need(money(b[k]) && b[k] >= 0, k, "Must be a non-negative amount with at most 2 decimals");
  }
  // OthValue exists to make this exact (see build.ts); if it doesn't, something
  // upstream changed and slipped past that.
  need(
    Math.abs(b.totalValue + b.cgstValue + b.sgstValue + b.igstValue + b.OthValue - b.totInvValue) < 0.005,
    "OthValue",
    "totalValue + tax + OthValue does not equal totInvValue"
  );
  need(b.itemList.length > 0, "itemList", "No items");
  b.itemList.forEach((it, i) => {
    const f = (n: string) => `itemList[${i + 1}].${n}`;
    need(/^(\d{4}|\d{6}|\d{8})$/.test(it.hsnCode), f("hsnCode"), `Invalid HSN "${it.hsnCode}"`);
    need(it.qtyUnit in UNIT_CODES, f("qtyUnit"), `Invalid unit "${it.qtyUnit}"`);
    need(money(it.taxableAmount), f("taxableAmount"), "Must have at most 2 decimals");
  });
  return out;
}

export const hasErrors = (issues: EwayIssue[]) => issues.some((i) => i.severity === "error");
