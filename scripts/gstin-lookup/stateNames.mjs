// Maps the state name text the GST portal's Search Taxpayer result shows
// (e.g. "Jammu and Kashmir") to the numeric GST state code our app uses
// (src/eway/codes.ts STATE_CODES, inverted). Kept as a small standalone copy
// rather than importing the TS module, since this runs as a plain .mjs
// script -- update both places if a state code ever changes.
export const STATE_NAME_TO_CODE = {
  "JAMMU AND KASHMIR": 1,
  "HIMACHAL PRADESH": 2,
  PUNJAB: 3,
  CHANDIGARH: 4,
  UTTARAKHAND: 5,
  HARYANA: 6,
  DELHI: 7,
  RAJASTHAN: 8,
  "UTTAR PRADESH": 9,
  BIHAR: 10,
  SIKKIM: 11,
  "ARUNACHAL PRADESH": 12,
  NAGALAND: 13,
  MANIPUR: 14,
  MIZORAM: 15,
  TRIPURA: 16,
  MEGHALAYA: 17,
  ASSAM: 18,
  "WEST BENGAL": 19,
  JHARKHAND: 20,
  ODISHA: 21,
  CHHATTISGARH: 22,
  "MADHYA PRADESH": 23,
  GUJARAT: 24,
  "DAMAN AND DIU": 25,
  "DADRA AND NAGAR HAVELI": 26,
  MAHARASHTRA: 27,
  KARNATAKA: 29,
  GOA: 30,
  LAKSHADWEEP: 31,
  KERALA: 32,
  "TAMIL NADU": 33,
  PUDUCHERRY: 34,
  "ANDAMAN AND NICOBAR": 35,
  TELANGANA: 36,
  "ANDHRA PRADESH": 37,
  "OTHER TERRITORY": 97,
  "OTHER COUNTRIES": 99,
};

/** @param {string} name @returns {number | null} */
export function stateCodeFromName(name) {
  return STATE_NAME_TO_CODE[name.trim().toUpperCase()] ?? null;
}
