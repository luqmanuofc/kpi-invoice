import type { Invoice } from "../api/invoices";
import { round2 } from "./build";
import { EWAY_SELLER } from "./config";
import { TRANS_MODE, VEHICLE_TYPE } from "./codes";
import { stateCodeFromGstin, URP } from "./gst";
import { extractPincode, inferStateFromPincode } from "./pincode";
import { assessEwayRequirement, type EwayRequirement } from "./requirement";
import type { EwayInput, EwayParty, EwayTransport } from "./types";

/** Facts the invoice doesn't carry, supplied per bill (e.g. from the export UI). */
export interface EwayOverrides {
  buyerPincode?: number | null;
  buyerStateCode?: number | null;
  buyerPlace?: string;
  sellerPincode?: number | null;
  transport?: Partial<EwayTransport>;
}

function splitAddress(address: string): [string, string] {
  const a = address.replace(/\s+/g, " ").trim();
  return [a.slice(0, 120), a.slice(120, 240)];
}

/** Last comma-separated part of a free-text address, minus PIN/state noise. */
function guessPlace(address: string): string {
  const parts = address
    .split(/[,\n]/)
    .map((p) => p.replace(/\(?\bJ\s*&\s*K\b\)?/gi, "").replace(/[0-9]{6}/g, "").replace(/[-\s]+$/, "").trim())
    .filter(Boolean);
  return (parts[parts.length - 1] ?? "").slice(0, 50);
}

function buyerParty(inv: Invoice, o: EwayOverrides): EwayParty {
  const gstin = (inv.buyerGstinSnapshot ?? "").trim().toUpperCase() || URP;
  const address = inv.buyerAddressSnapshot ?? "";
  const pincode = o.buyerPincode ?? extractPincode(address);
  const stateCode =
    stateCodeFromGstin(gstin) ??
    o.buyerStateCode ??
    (pincode !== null ? inferStateFromPincode(pincode) : null);
  const [address1, address2] = splitAddress(address);
  return {
    gstin,
    name: inv.buyerNameSnapshot,
    address1,
    address2,
    place: o.buyerPlace ?? guessPlace(address),
    pincode,
    stateCode,
    actualStateCode: stateCode,
  };
}

function sellerParty(inv: Invoice, o: EwayOverrides): EwayParty {
  const gstin = inv.sellerGstinSnapshot.trim().toUpperCase();
  const stateCode = stateCodeFromGstin(gstin);
  const [address1, address2] = splitAddress(inv.sellerAddressSnapshot);
  return {
    gstin,
    name: inv.sellerNameSnapshot,
    address1,
    address2,
    place: EWAY_SELLER.place,
    pincode: o.sellerPincode ?? extractPincode(inv.sellerAddressSnapshot) ?? EWAY_SELLER.pincode,
    stateCode,
    actualStateCode: stateCode,
  };
}

// The invoice discount is not a line item, but the portal wants taxable
// amounts per item that add up to the taxable value. Spread it in proportion
// to line value; the last line absorbs the rounding remainder.
function taxableAmounts(inv: Invoice): number[] {
  const lines = (inv.items ?? []).map((i) => i.lineTotal);
  const gross = lines.reduce((s, v) => s + v, 0);
  if (gross <= 0 || inv.discount <= 0) return lines.map(round2);
  const out = lines.map((v) => round2(v - (inv.discount * v) / gross));
  const target = round2(gross - inv.discount);
  out[out.length - 1] = round2(out[out.length - 1] + (target - out.reduce((s, v) => s + v, 0)));
  return out;
}

export function invoiceToEwayInput(inv: Invoice, o: EwayOverrides = {}): EwayInput {
  const docDate = inv.date.slice(0, 10);
  const amounts = taxableAmounts(inv);
  return {
    userGstin: inv.sellerGstinSnapshot.trim().toUpperCase(),
    docNo: inv.invoiceNumber,
    docDate,
    from: sellerParty(inv, o),
    to: buyerParty(inv, o),
    items: (inv.items ?? []).map((it, i) => ({
      description: it.description,
      hsn: it.hsn,
      qty: it.qty,
      unit: it.unit,
      taxableAmount: amounts[i],
    })),
    cgstRate: inv.cgstRate,
    sgstRate: inv.sgstRate,
    igstRate: inv.igstRate,
    cgstValue: inv.cgstAmount,
    sgstValue: inv.sgstAmount,
    igstValue: inv.igstAmount,
    totInvValue: inv.total,
    transport: {
      mode: TRANS_MODE.ROAD,
      distanceKm: 0,
      vehicleNo: inv.vehicleNumber ?? "",
      vehicleType: VEHICLE_TYPE.REGULAR,
      transporterId: "",
      transporterName: "",
      transDocNo: "",
      transDocDate: docDate,
      ...o.transport,
    },
  };
}

/** Does this invoice need an e-way bill? (All products here are goods.) */
export function assessInvoice(inv: Invoice, o: EwayOverrides = {}): EwayRequirement {
  return assessEwayRequirement({
    invoiceValue: inv.total,
    fromStateCode: stateCodeFromGstin(inv.sellerGstinSnapshot),
    toStateCode: buyerParty(inv, o).stateCode,
  });
}
