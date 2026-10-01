import { STATE_CODES } from "./codes";

export const URP = "URP"; // GSTIN placeholder for an unregistered person

const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]{3}$/;

export function isValidGstin(gstin: string): boolean {
  return GSTIN_RE.test(gstin);
}

/** State code from a GSTIN's first two digits, or null for URP / malformed. */
export function stateCodeFromGstin(gstin: string | null | undefined): number | null {
  const g = (gstin ?? "").trim().toUpperCase();
  if (!isValidGstin(g)) return null;
  const code = Number(g.slice(0, 2));
  return code in STATE_CODES ? code : null;
}

// Vehicle number formats accepted by the portal (Preparation Tool regexes).
const VEHICLE_RES = [
  /^[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{4}$/, // KA12KA1234
  /^[A-Z]{2}[0-9]{2}[A-Z][0-9]{4}$/, // KA12K1234
  /^[A-Z]{2}[0-9]{6}$/, // KA123456 (also DFxxxxxx, TMxxxxxx, BPxxxxxx, NPxxxxxx)
  /^[A-Z]{3}[0-9]{4}$/, // KAR1234
  /^[A-Z]{2}[0-9]{3}[A-Z][0-9]{4}$/, // KA123K1234
  /^[A-Z]{2}[0-9]{2}[A-Z]{3}[0-9]{4}$/, // KA12KAR1234
  /^(DF|TM|BP|NP)[0-9A-Z]{6}$/,
];

export function normalizeVehicleNo(v: string): string {
  return v.replace(/[\s-]/g, "").toUpperCase();
}

export function isValidVehicleNo(v: string): boolean {
  const n = normalizeVehicleNo(v);
  return n.length >= 5 && n.length <= 15 && VEHICLE_RES.some((re) => re.test(n));
}
