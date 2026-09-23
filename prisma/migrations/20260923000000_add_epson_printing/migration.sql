-- CreateTable
CREATE TABLE "EpsonConnection" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "accessTokenExpiresAt" TIMESTAMP(3) NOT NULL,
    "refreshedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EpsonConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EpsonPrintJob" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "epsonJobId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EpsonPrintJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EpsonPrintJob_epsonJobId_key" ON "EpsonPrintJob"("epsonJobId");

-- CreateIndex
CREATE INDEX "EpsonPrintJob_invoiceId_idx" ON "EpsonPrintJob"("invoiceId");

-- AddForeignKey
ALTER TABLE "EpsonPrintJob" ADD CONSTRAINT "EpsonPrintJob_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
