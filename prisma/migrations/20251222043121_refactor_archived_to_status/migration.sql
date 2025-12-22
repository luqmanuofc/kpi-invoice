-- Step 1: Add ARCHIVED to InvoiceStatus enum
ALTER TYPE "InvoiceStatus" ADD VALUE 'ARCHIVED';

-- Step 2: Drop the archived column
ALTER TABLE "Invoice" DROP COLUMN "archived";
