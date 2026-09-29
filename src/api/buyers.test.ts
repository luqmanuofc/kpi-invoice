import { describe, expect, it } from "vitest";
import { isBuyerGstVerified, type Buyer } from "./buyers";

function makeBuyer(over: Partial<Buyer> = {}): Buyer {
  return {
    id: "b1",
    name: "Test Buyer",
    address: "Somewhere",
    gstin: "01ABCDE1234F1Z5",
    phone: null,
    pincode: 190001,
    stateCode: 1,
    gstVerifiedAt: "2026-09-01T00:00:00.000Z",
    gstLegalName: null,
    gstTradeName: null,
    gstAddress: null,
    createdAt: "",
    updatedAt: "",
    ...over,
  };
}

describe("isBuyerGstVerified", () => {
  it("is true only once gstVerifiedAt is set", () => {
    expect(isBuyerGstVerified(makeBuyer({ gstVerifiedAt: "2026-09-01T00:00:00.000Z" }))).toBe(true);
    expect(isBuyerGstVerified(makeBuyer({ gstVerifiedAt: null }))).toBe(false);
  });
});
