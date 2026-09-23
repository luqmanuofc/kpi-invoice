// Shared Zod schema for printing an invoice via the Epson Connect API.
// Imported by both the frontend (src/api/print.ts) and the Netlify backend
// (netlify/functions/printInvoiceEpson.ts) so wire-format validation is
// identical on both sides.
import { z } from "zod";

export const PrintInvoiceRequestSchema = z.object({
  invoiceId: z.string().min(1),
  fileName: z.string().min(1),
  pdfBase64: z.string().min(1),
});

export type PrintInvoiceRequest = z.infer<typeof PrintInvoiceRequestSchema>;

// Statuses that mean "a job is already in flight for this invoice" -- a new
// print should be blocked while one of these is the latest status.
export const IN_FLIGHT_PRINT_STATUSES = [
  "preparing",
  "reserved",
  "pending",
  "processing",
] as const;

export interface EpsonPrintJob {
  id: string;
  invoiceId: string;
  epsonJobId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}
