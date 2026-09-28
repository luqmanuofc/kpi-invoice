-- AlterTable
ALTER TABLE "Buyer" ADD COLUMN     "gstVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "gstLegalName" TEXT,
ADD COLUMN     "gstTradeName" TEXT,
ADD COLUMN     "gstAddress" TEXT;
