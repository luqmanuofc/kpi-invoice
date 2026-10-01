// PIN code helpers. The portal rejects a bill whose PIN code does not belong
// to the stated state. NIC's own PIN master isn't available offline, so this
// maps PIN prefixes to the state(s) they can belong to. Where a prefix is
// shared by several states (e.g. 60x Tamil Nadu / Puducherry) all candidates
// are accepted, so the check never raises a false mismatch on those; it only
// catches clear errors (e.g. a Delhi PIN with a J&K state code).

const PREFIX_2: Record<string, number[]> = {
  "11": [7],
  "12": [6],
  "13": [6],
  "14": [3],
  "15": [3],
  "16": [4, 3, 6],
  "17": [2],
  "18": [1],
  "19": [1, 38],
  "20": [9],
  "21": [9],
  "22": [9],
  "23": [9],
  "24": [9, 5],
  "25": [9],
  "26": [9, 5],
  "27": [9],
  "28": [9],
  "30": [8],
  "31": [8],
  "32": [8],
  "33": [8],
  "34": [8],
  "36": [24],
  "37": [24],
  "38": [24],
  "39": [24, 25, 26],
  "40": [27, 30],
  "41": [27],
  "42": [27],
  "43": [27],
  "44": [27],
  "45": [23],
  "46": [23],
  "47": [23],
  "48": [23],
  "49": [22],
  "50": [36, 37],
  "51": [37, 36],
  "52": [37, 36],
  "53": [37, 36, 34],
  "56": [29],
  "57": [29],
  "58": [29],
  "59": [29],
  "60": [33, 34],
  "61": [33, 34],
  "62": [33],
  "63": [33],
  "64": [33],
  "67": [32, 34],
  "68": [32, 31],
  "69": [32],
  "70": [19],
  "71": [19],
  "72": [19],
  "73": [19, 11],
  "74": [19, 35],
  "75": [21],
  "76": [21],
  "77": [21],
  "78": [18],
  "79": [12, 13, 14, 15, 16, 17],
  "80": [10, 20],
  "81": [10, 20],
  "82": [10, 20],
  "83": [10, 20],
  "84": [10, 20],
  "85": [10, 20],
};

export function isValidPincodeFormat(pin: number | string): boolean {
  return /^[1-9][0-9]{5}$/.test(String(pin));
}

/** States a PIN can belong to, or null when the prefix isn't in the table. */
export function statesForPincode(pin: number | string): number[] | null {
  const p = String(pin);
  if (!isValidPincodeFormat(p)) return null;
  return PREFIX_2[p.slice(0, 2)] ?? null;
}

export function pincodeMatchesState(pin: number | string, stateCode: number): boolean | null {
  const states = statesForPincode(pin);
  return states ? states.includes(stateCode) : null;
}

/** The state a PIN belongs to, only when it is unambiguous. */
export function inferStateFromPincode(pin: number | string): number | null {
  const states = statesForPincode(pin);
  return states && states.length === 1 ? states[0] : null;
}

/** Last 6-digit PIN found in free-text address, or null. */
export function extractPincode(address: string): number | null {
  const matches = address.match(/(?<![0-9])[1-9][0-9]{5}(?![0-9])/g);
  return matches ? Number(matches[matches.length - 1]) : null;
}
