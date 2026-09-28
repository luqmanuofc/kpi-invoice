import { describe, expect, it } from "vitest";
import { blockedByGstVerification, isBuyerGstVerified, type Buyer } from "./buyers";

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

describe("blockedByGstVerification", () => {
  it("blocks a required e-way bill for an unverified GSTIN buyer", () => {
    const buyer = makeBuyer({ gstVerifiedAt: null });
    expect(blockedByGstVerification(true, buyer)).toBe(true);
  });

  it("does not block a verified buyer", () => {
    const buyer = makeBuyer({ gstVerifiedAt: "2026-09-01T00:00:00.000Z" });
    expect(blockedByGstVerification(true, buyer)).toBe(false);
  });

  it("does not block when the invoice doesn't need an e-way bill", () => {
    const buyer = makeBuyer({ gstVerifiedAt: null });
    expect(blockedByGstVerification(false, buyer)).toBe(false);
  });

  it("does not block a buyer with no GSTIN (URP) -- nothing to verify", () => {
    const buyer = makeBuyer({ gstin: null, gstVerifiedAt: null });
    expect(blockedByGstVerification(true, buyer)).toBe(false);
  });

  it("does not block when the buyer record hasn't loaded yet", () => {
    expect(blockedByGstVerification(true, undefined)).toBe(false);
  });
});
