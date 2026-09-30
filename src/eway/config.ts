// Consignor (seller) details the e-way bill needs but invoices don't store,
// or store in a form the portal won't accept. The seller's name/GSTIN still
// come from the invoice snapshot; address, place and PIN code deliberately
// come from here instead, not from the invoice's own address text -- that
// text is a printed-invoice snapshot the user edits freely and isn't meant
// to double as this portal's clean, official-registration input, so this is
// kept separate on purpose rather than derived from it.
// Confirmed against the official GST Search Taxpayer record for
// 01BSGPB0427H1ZJ (2026-09-30) and a real accepted e-way bill (CommonReport.xls,
// 27 Sep 2026): "From GSTIN Info" showed "...SHALLATENG SRINAGAR 190017 JAMMU AND KASHMIR".
export const EWAY_SELLER = {
  address: "28, SIDCO Complex, Shallateng, Srinagar, Jammu and Kashmir",
  place: "SRINAGAR",
  pincode: 190017 as number | null,
};
