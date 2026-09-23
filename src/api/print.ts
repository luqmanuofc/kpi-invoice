import { apiClient } from "../utils/auth";
import {
  PrintInvoiceRequestSchema,
  type PrintInvoiceRequest,
  type EpsonPrintJob,
} from "../schemas/printInvoice";

export async function printInvoiceEpson(
  data: PrintInvoiceRequest
): Promise<EpsonPrintJob> {
  const parsed = PrintInvoiceRequestSchema.parse(data);

  const response = await apiClient("/.netlify/functions/printInvoiceEpson", {
    method: "POST",
    body: JSON.stringify(parsed),
  });

  const json = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(json?.error || "Failed to send invoice to printer");
  }
  return json;
}

export async function getLatestPrintJob(
  invoiceId: string
): Promise<EpsonPrintJob | null> {
  const response = await apiClient(
    `/.netlify/functions/getLatestPrintJob?invoiceId=${invoiceId}`,
    { method: "GET" }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Get print job failed: ${text}`);
  }

  return response.json();
}
