// Consignor (seller) details the e-way bill needs but invoices don't store.
// The seller's name, address and GSTIN come from the invoice snapshot; the
// invoice address has no PIN code, so set it here.
// Confirmed against a real accepted e-way bill (CommonReport.xls, 27 Sep 2026):
// "From GSTIN Info" showed "...SHALLATENG SRINAGAR 190017 JAMMU AND KASHMIR".
export const EWAY_SELLER = {
  place: "SRINAGAR",
  pincode: 190017 as number | null,
};
