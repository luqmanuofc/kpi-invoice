import { getAuthHeaders } from "../utils/auth";

export interface DashboardMetrics {
  totalInvoices: number;
  totalRevenue: number;
  month: string;
}

export interface InvoiceExportData {
  invoiceNumber: string;
  date: string;
  buyerId: string;
  buyerName: string;
  buyerGstin: string;
  subtotal: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  total: number;
}

export async function getDashboardMetrics(
  month: string
): Promise<DashboardMetrics> {
  const url = `/.netlify/functions/getDashboardMetrics?month=${month}`;

  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Get dashboard metrics failed: ${text}`);
  }

  return response.json();
}

export async function getInvoicesForExport(
  month: string
): Promise<InvoiceExportData[]> {
  const url = `/.netlify/functions/getInvoicesForExport?month=${month}`;

  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Get invoices for export failed: ${text}`);
  }

  const data = await response.json();
  return data.invoices;
}
