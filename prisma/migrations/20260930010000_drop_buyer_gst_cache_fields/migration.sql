-- AlterTable
-- These four were a duplicate cache of data that already lives in
-- GstVerification (legalName, tradeName, principalAddress, verifiedAt).
-- Buyer.pincode/stateCode are kept -- they're the only fields left with a
-- real use case (manual entry for a buyer with no GSTIN).
ALTER TABLE "Buyer" DROP COLUMN "gstVerifiedAt",
DROP COLUMN "gstLegalName",
DROP COLUMN "gstTradeName",
DROP COLUMN "gstAddress";
