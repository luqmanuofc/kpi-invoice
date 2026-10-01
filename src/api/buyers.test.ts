import { describe, expect, it } from "vitest";
import {
  isBuyerGstVerified,
  latestGstVerification,
  type Buyer,
  type GstVerificationDetail,
} from "./buyers";

function makeBuyer(over: Partial<Buyer> = {}): Buyer {
  return {
    id: "b1",
    name: "Test Buyer",
    address: "Somewhere",
    gstin: "01ABCDE1234F1Z5",
    phone: null,
    createdAt: "",
    updatedAt: "",
    ...over,
  };
}

function makeVerification(over: Partial<GstVerificationDetail> = {}): GstVerificationDetail {
  return {
    id: "gv1",
    gstin: "01ABCDE1234F1Z5",
    verifiedAt: "2026-09-01T00:00:00.000Z",
    legalName: "Test Legal Name",
    tradeName: null,
    registrationDate: null,
    constitutionOfBusiness: null,
    gstinStatus: null,
    taxpayerType: null,
    principalAddress: null,
    pincode: 190001,
    stateCode: 1,
    raw: null,
    ...over,
  };
}

describe("latestGstVerification", () => {
  it("returns the row when its gstin matches the buyer's current gstin", () => {
    const buyer = makeBuyer({ gstVerifications: [makeVerification()] });
    expect(latestGstVerification(buyer)?.id).toBe("gv1");
  });

  it("returns undefined when there's no verification at all", () => {
    const buyer = makeBuyer({ gstVerifications: [] });
    expect(latestGstVerification(buyer)).toBeUndefined();
    expect(latestGstVerification(makeBuyer({ gstVerifications: undefined }))).toBeUndefined();
  });

  it("returns undefined for a stale verification against a since-changed GSTIN", () => {
    const buyer = makeBuyer({
      gstin: "01NEWGSTIN123X1Z9",
      gstVerifications: [makeVerification({ gstin: "01ABCDE1234F1Z5" })],
    });
    expect(latestGstVerification(buyer)).toBeUndefined();
  });
});

describe("isBuyerGstVerified", () => {
  it("is true only once a matching GstVerification exists", () => {
    expect(isBuyerGstVerified(makeBuyer({ gstVerifications: [makeVerification()] }))).toBe(true);
    expect(isBuyerGstVerified(makeBuyer({ gstVerifications: [] }))).toBe(false);
  });

  it("is false for a verification whose gstin no longer matches the buyer", () => {
    const buyer = makeBuyer({
      gstin: "01NEWGSTIN123X1Z9",
      gstVerifications: [makeVerification({ gstin: "01ABCDE1234F1Z5" })],
    });
    expect(isBuyerGstVerified(buyer)).toBe(false);
  });
});
