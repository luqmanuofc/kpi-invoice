// Does an invoice need an e-way bill?
//
// Rule 138 CGST Rules: movement of goods with a consignment value above
// Rs 50,000 needs one. Value = invoice value including tax. States may set a
// different limit for movement *within* the state; inter-state is always 50k.
//
// Not modelled: goods exempt from e-way bills (Rule 138(14) list), and several
// invoices to one consignee in one vehicle being summed towards the limit.

export const EWAY_THRESHOLD = 50_000;

// Intra-state limits that differ from the default, by state code. Taken from
// secondary sources (busy.in, July 2026); state notifications change often and
// sources disagree on some (e.g. J&K, which is left at the default because
// over-flagging is safer than missing a required bill). Confirm before relying.
export const INTRA_STATE_THRESHOLDS: Record<number, number> = {
  7: 100_000, // Delhi
  8: 100_000, // Rajasthan (2,00,000 within the same city)
  3: 100_000, // Punjab
  10: 100_000, // Bihar
  20: 100_000, // Jharkhand
  23: 100_000, // Madhya Pradesh
  27: 100_000, // Maharashtra
  33: 100_000, // Tamil Nadu
};

export interface EwayRequirement {
  required: boolean;
  threshold: number;
  intraState: boolean;
  reason: string;
}

export function assessEwayRequirement(args: {
  invoiceValue: number;
  fromStateCode: number | null;
  toStateCode: number | null;
  isGoods?: boolean;
}): EwayRequirement {
  const { invoiceValue, fromStateCode, toStateCode, isGoods = true } = args;
  const intraState =
    fromStateCode !== null && toStateCode !== null && fromStateCode === toStateCode;
  const threshold = intraState
    ? (INTRA_STATE_THRESHOLDS[fromStateCode] ?? EWAY_THRESHOLD)
    : EWAY_THRESHOLD;

  if (!isGoods) {
    return { required: false, threshold, intraState, reason: "Not a movement of goods" };
  }
  const required = invoiceValue > threshold;
  return {
    required,
    threshold,
    intraState,
    reason: required
      ? `Value ${invoiceValue} exceeds the ${intraState ? "intra-state" : "50,000"} limit of ${threshold}`
      : `Value ${invoiceValue} is within the limit of ${threshold}`,
  };
}
