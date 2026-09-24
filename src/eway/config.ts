// Consignor (seller) details the e-way bill needs but invoices don't store.
// The seller's name, address and GSTIN come from the invoice snapshot; the
// invoice address has no PIN code, so set it here. Until it is set every bill
// fails validation with "Missing or invalid PIN code" on from.pincode.
export const EWAY_SELLER = {
  place: "SRINAGAR",
  pincode: null as number | null,
};
