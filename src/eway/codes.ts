// NIC e-way bill bulk-upload code lists and constants.
//
// Source of truth: the official "Bulk Generation Tools" on the e-way bill
// portal (docs.ewaybillgst.gov.in/html/formatdownload.html):
//   - EWB_Attributes_new.xlsx   -> attribute rules, "Master Codes" sheet
//   - EWB_Preparation_Tool_new.xlsm -> the JSON the portal's own tool emits
// Re-check these against the portal whenever NIC publishes a new tool.

// The current ("New") JSON Preparation Tool writes this version string.
// (The attributes workbook header says 1.0.0621 and its sample says 1.0.1118;
// the Preparation Tool is what the portal itself produces, so we follow it.)
export const EWB_JSON_VERSION = "1.0.0918";

export const SUPPLY_TYPE = { OUTWARD: "O", INWARD: "I" } as const;

export const SUB_SUPPLY_TYPE = {
  SUPPLY: 1,
  IMPORT: 2,
  EXPORT: 3,
  JOB_WORK: 4,
  FOR_OWN_USE: 5,
  JOB_WORK_RETURNS: 6,
  SALES_RETURN: 7,
  OTHERS: 8,
  SKD_CKD: 9,
  LINE_SALES: 10,
  RECIPIENT_NOT_KNOWN: 11,
  EXHIBITION_OR_FAIRS: 12,
} as const;

export const DOC_TYPE = {
  TAX_INVOICE: "INV",
  BILL_OF_SUPPLY: "BIL",
  BILL_OF_ENTRY: "BOE",
  DELIVERY_CHALLAN: "CHL",
  OTHERS: "OTH",
} as const;

export const TRANS_MODE = { ROAD: 1, RAIL: 2, AIR: 3, SHIP: 4 } as const;
export type TransMode = (typeof TRANS_MODE)[keyof typeof TRANS_MODE];

export const VEHICLE_TYPE = { REGULAR: "R", ODC: "O" } as const;
export type VehicleType = (typeof VEHICLE_TYPE)[keyof typeof VEHICLE_TYPE];

export const MAX_DISTANCE_KM = 4000;

// State master (Master Codes sheet). Keyed by numeric GST state code.
export const STATE_CODES: Record<number, string> = {
  1: "JAMMU AND KASHMIR",
  2: "HIMACHAL PRADESH",
  3: "PUNJAB",
  4: "CHANDIGARH",
  5: "UTTARAKHAND",
  6: "HARYANA",
  7: "DELHI",
  8: "RAJASTHAN",
  9: "UTTAR PRADESH",
  10: "BIHAR",
  11: "SIKKIM",
  12: "ARUNACHAL PRADESH",
  13: "NAGALAND",
  14: "MANIPUR",
  15: "MIZORAM",
  16: "TRIPURA",
  17: "MEGHALAYA",
  18: "ASSAM",
  19: "WEST BENGAL",
  20: "JHARKHAND",
  21: "ODISHA",
  22: "CHHATTISGARH",
  23: "MADHYA PRADESH",
  24: "GUJARAT",
  25: "DAMAN AND DIU",
  26: "DADRA AND NAGAR HAVELI",
  27: "MAHARASHTRA",
  29: "KARNATAKA",
  30: "GOA",
  31: "LAKSHADWEEP",
  32: "KERALA",
  33: "TAMIL NADU",
  34: "PUDUCHERRY",
  35: "ANDAMAN AND NICOBAR",
  36: "TELANGANA",
  37: "ANDHRA PRADESH",
  97: "OTHER TERRITORY",
  99: "OTHER COUNTRIES",
};

// Unit Quantity Codes (Master Codes sheet): code -> description.
export const UNIT_CODES: Record<string, string> = {
  BAG: "BAGS",
  BAL: "BALE",
  BDL: "BUNDLES",
  BKL: "BUCKLES",
  BOU: "BILLION OF UNITS",
  BOX: "BOX",
  BTL: "BOTTLES",
  BUN: "BUNCHES",
  CAN: "CANS",
  CBM: "CUBIC METERS",
  CCM: "CUBIC CENTIMETERS",
  CMS: "CENTIMETERS",
  CTN: "CARTONS",
  DOZ: "DOZENS",
  DRM: "DRUMS",
  GGK: "GREAT GROSS",
  GMS: "GRAMMES",
  GRS: "GROSS",
  GYD: "GROSS YARDS",
  KGS: "KILOGRAMS",
  KLR: "KILOLITRE",
  KME: "KILOMETRE",
  LTR: "LITRES",
  MLT: "MILILITRE",
  MTR: "METERS",
  MTS: "METRIC TON",
  NOS: "NUMBERS",
  OTH: "OTHERS",
  PAC: "PACKS",
  PCS: "PIECES",
  PRS: "PAIRS",
  QTL: "QUINTAL",
  ROL: "ROLLS",
  SET: "SETS",
  SQF: "SQUARE FEET",
  SQM: "SQUARE METERS",
  SQY: "SQUARE YARDS",
  TBS: "TABLETS",
  TGM: "TEN GROSS",
  THD: "THOUSANDS",
  TON: "TONNES",
  TUB: "TUBES",
  UGS: "US GALLONS",
  UNT: "UNITS",
  YDS: "YARDS",
};

// Unit strings used elsewhere in this app (ProductDrawer defaults, free-typed
// units) mapped to NIC codes. Anything not here or in UNIT_CODES fails
// validation rather than being guessed.
const UNIT_ALIASES: Record<string, string> = {
  DZ: "DOZ",
  DZN: "DOZ",
  RL: "ROL",
  ROLL: "ROL",
  PC: "PCS",
  PIECE: "PCS",
  NO: "NOS",
  NUMBER: "NOS",
  KG: "KGS",
  KGM: "KGS",
  M: "MTR",
  MTRS: "MTR",
  METER: "MTR",
  METRE: "MTR",
  L: "LTR",
  LT: "LTR",
  BUNDLE: "BDL",
  BUNDLES: "BDL",
  SQFT: "SQF",
  SQMT: "SQM",
  QTL: "QTL",
};

/** Normalise an app unit string to a NIC unit code, or null if unknown. */
export function toNicUnit(unit: string): string | null {
  const u = unit.trim().toUpperCase();
  if (u in UNIT_CODES) return u;
  return UNIT_ALIASES[u] ?? null;
}

// Table 1 (Validations sheet): tax rates the portal accepts, in percent.
// The published table predates GST 2.0 (22 Sep 2025, slabs 5/18/40 with the
// 12/28 slabs removed); 20 (CGST/SGST) and 40 (IGST) are added here so current
// invoices are not flagged. Verify against the portal if a rate is rejected.
export const STANDARD_CGST_SGST_RATES = [0, 0.05, 0.125, 1.5, 2.5, 6, 9, 14, 20];
export const STANDARD_IGST_RATES = [0, 0.1, 0.25, 3, 5, 12, 18, 28, 40];

// Text-field character sets used by the official Preparation Tool.
export const ADDRESS_CHARS = /^[A-Za-z0-9 @#\-/,&.]*$/;
export const DOC_NO_CHARS = /^[A-Za-z0-9 \-/.]*$/;
