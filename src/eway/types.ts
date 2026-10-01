import type { TransMode, VehicleType } from "./codes";

// Everything here is plain data with no dependency on the app's Invoice type,
// so the same builder can feed the portal's bulk upload today and a GSP API
// (whose request body is nearly identical) later.

export interface EwayParty {
  gstin: string; // 15-char GSTIN, or "URP" for an unregistered person
  name: string;
  address1: string;
  address2: string;
  place: string;
  pincode: number | null;
  stateCode: number | null; // bill-from / bill-to state
  actualStateCode: number | null; // dispatch-from / ship-to state
}

export interface EwayItem {
  description: string;
  hsn: string;
  qty: number;
  unit: string; // app unit; mapped to a NIC code by the builder
  taxableAmount: number; // after any invoice discount
}

export interface EwayTransport {
  mode: TransMode;
  distanceKm: number; // 0 = let the portal calculate from the PIN codes
  vehicleNo: string;
  vehicleType: VehicleType;
  transporterId: string;
  transporterName: string;
  transDocNo: string;
  transDocDate: string; // YYYY-MM-DD or ""
}

export interface EwayInput {
  userGstin: string;
  docNo: string;
  docDate: string; // YYYY-MM-DD
  from: EwayParty;
  to: EwayParty;
  items: EwayItem[];
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  cgstValue: number;
  sgstValue: number;
  igstValue: number;
  totInvValue: number;
  transport: EwayTransport;
}

export interface EwayBillItem {
  itemNo: number;
  productName: string;
  productDesc: string;
  hsnCode: string;
  quantity: number;
  qtyUnit: string;
  taxableAmount: number;
  sgstRate: number;
  cgstRate: number;
  igstRate: number;
  cessRate: number;
  cessNonAdvol: number;
}

// Key order follows the official sample so output is easy to diff.
export interface EwayBill {
  userGstin: string;
  supplyType: "O" | "I";
  subSupplyType: number;
  docType: string;
  docNo: string;
  docDate: string; // dd/mm/yyyy
  fromGstin: string;
  fromTrdName: string;
  fromAddr1: string;
  fromAddr2: string;
  fromPlace: string;
  fromPincode: number;
  fromStateCode: number;
  actualFromStateCode: number;
  toGstin: string;
  toTrdName: string;
  toAddr1: string;
  toAddr2: string;
  toPlace: string;
  toPincode: number;
  toStateCode: number;
  actualToStateCode: number;
  totalValue: number;
  cgstValue: number;
  sgstValue: number;
  igstValue: number;
  cessValue: number;
  TotNonAdvolVal: number;
  OthValue: number;
  totInvValue: number;
  transMode: number;
  transDistance: number;
  transporterName: string;
  transporterId: string;
  transDocNo: string;
  transDocDate: string; // dd/mm/yyyy or ""
  vehicleNo: string;
  vehicleType: string;
  mainHsnCode: string;
  itemList: EwayBillItem[];
}

export interface EwayBulkFile {
  version: string;
  billLists: EwayBill[];
}

export type IssueSeverity = "error" | "warning" | "info";

export interface EwayIssue {
  severity: IssueSeverity;
  field: string;
  message: string;
}
