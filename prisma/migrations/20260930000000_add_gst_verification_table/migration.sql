-- CreateTable
CREATE TABLE "GstVerification" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "gstin" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "legalName" TEXT,
    "tradeName" TEXT,
    "registrationDate" TEXT,
    "constitutionOfBusiness" TEXT,
    "gstinStatus" TEXT,
    "taxpayerType" TEXT,
    "principalAddress" TEXT,
    "pincode" INTEGER,
    "stateCode" INTEGER,
    "raw" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GstVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GstVerification_buyerId_idx" ON "GstVerification"("buyerId");

-- CreateIndex
CREATE INDEX "GstVerification_gstin_idx" ON "GstVerification"("gstin");

-- AddForeignKey
ALTER TABLE "GstVerification" ADD CONSTRAINT "GstVerification_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Buyer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
