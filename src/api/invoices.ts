import type { InvoiceForm } from "../invoice-form/types";
import { getAuthHeaders } from "../utils/auth";

export interface Invoice {
  id: string;
  invoiceNumber: string;
  vehicleNumber: string;
  date: string;

  buyerId: string;
  buyerNameSnapshot: string;
  buyerAddressSnapshot: string;
  buyerGstinSnapshot: string | null;
  buyerPhoneSnapshot: string | null;

  sellerNameSnapshot: string;
  sellerAddressSnapshot: string;
  sellerGstinSnapshot: string;
  sellerEmailSnapshot: string;
  sellerPhoneSnapshot: string;

  cgstRate: number;
  sgstRate: number;
  igstRate: number;

  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;

  discount: number;
  subtotal: number;
  total: number;
  amountInWords: string;

  status: "pending" | "paid" | "archived";
  internalNote: string | null;

  createdAt: string;
  updatedAt: string;

  items?: Array<{
    id: string;
    productId: string;
    description: string;
    hsn: string;
    qty: number;
    unit: string;
    rate: number;
    lineTotal: number;
    position: number;
  }>;
}

export interface InvoicesPaginationResponse {
  invoices: Invoice[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

export interface GetInvoicesParams {
  buyerId?: string;
  productId?: string;
  page?: number;
  pageSize?: number;
  invoiceNumber?: string;
  status?: Array<"pending" | "paid" | "archived">;
  startDate?: string;
  endDate?: string;
}

function normalizeInvoice(invoice: any): Invoice {
  return {
    ...invoice,
    cgstRate: Number(invoice.cgstRate),
    sgstRate: Number(invoice.sgstRate),
    igstRate: Number(invoice.igstRate),
    cgstAmount: Number(invoice.cgstAmount),
    sgstAmount: Number(invoice.sgstAmount),
    igstAmount: Number(invoice.igstAmount),
    discount: Number(invoice.discount),
    subtotal: Number(invoice.subtotal),
    total: Number(invoice.total),
    items: invoice.items?.map((item: any) => ({
      ...item,
      qty: Number(item.qty),
      rate: Number(item.rate),
      lineTotal: Number(item.lineTotal),
      position: Number(item.position),
    })),
  };
}

export async function createInvoice(data: InvoiceForm): Promise<Invoice> {
  const response = await fetch("/.netlify/functions/createInvoice", {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Create invoice failed: ${text}`);
  }

  const invoice = await response.json();
  return normalizeInvoice(invoice);
}

export async function getInvoices(
  params?: GetInvoicesParams
): Promise<InvoicesPaginationResponse> {
  const searchParams = new URLSearchParams();

  if (params?.buyerId) {
    searchParams.append("buyerId", params.buyerId);
  }
  if (params?.productId) {
    searchParams.append("productId", params.productId);
  }
  if (params?.page) {
    searchParams.append("page", params.page.toString());
  }
  if (params?.pageSize) {
    searchParams.append("pageSize", params.pageSize.toString());
  }
  if (params?.invoiceNumber) {
    searchParams.append("invoiceNumber", params.invoiceNumber);
  }
  if (params?.status && params.status.length > 0) {
    searchParams.append("status", params.status.join(","));
  }
  if (params?.startDate) {
    searchParams.append("startDate", params.startDate);
  }
  if (params?.endDate) {
    searchParams.append("endDate", params.endDate);
  }

  const url = `/.netlify/functions/getInvoices${
    searchParams.toString() ? `?${searchParams.toString()}` : ""
  }`;

  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Get invoices failed: ${text}`);
  }

  const data = await response.json();
  return {
    ...data,
    invoices: data.invoices.map(normalizeInvoice),
  };
}

export async function getInvoiceById(id: string): Promise<Invoice> {
  const response = await fetch(`/.netlify/functions/getInvoice?id=${id}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Get invoice failed: ${text}`);
  }

  const invoice = await response.json();
  return normalizeInvoice(invoice);
}

export async function checkInvoiceNumber(
  invoiceNumber: string
): Promise<{ exists: boolean }> {
  const response = await fetch(
    `/.netlify/functions/checkInvoiceNumber?invoiceNumber=${encodeURIComponent(
      invoiceNumber
    )}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Check invoice number failed: ${text}`);
  }

  return response.json();
}

export async function updateInvoiceStatus(
  id: string,
  status: "pending" | "paid" | "archived"
): Promise<Invoice> {
  const statusMap = {
    pending: "PENDING",
    paid: "PAID",
    archived: "ARCHIVED",
  };

  const response = await fetch("/.netlify/functions/updateInvoiceStatus", {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      id,
      status: statusMap[status],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Update invoice status failed: ${text}`);
  }

  const invoice = await response.json();
  return normalizeInvoice(invoice);
}

export interface InvoiceStatusLog {
  id: string;
  invoiceId: string;
  oldStatus: "pending" | "paid" | "archived";
  newStatus: "pending" | "paid" | "archived";
  changedAt: string;
}

export async function getInvoiceStatusLogs(
  invoiceId: string
): Promise<InvoiceStatusLog[]> {
  const response = await fetch(
    `/.netlify/functions/getInvoiceStatusLogs?invoiceId=${invoiceId}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Get invoice status logs failed: ${text}`);
  }

  return response.json();
}

export async function archiveInvoice(id: string): Promise<Invoice> {
  return updateInvoiceStatus(id, "archived");
}

export async function getNextInvoiceNumber(
  prefix: string = "2025-26/"
): Promise<{ nextInvoiceNumber: string; prefix: string; nextNumber: number }> {
  const response = await fetch(
    `/.netlify/functions/getNextInvoiceNumber?prefix=${encodeURIComponent(
      prefix
    )}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Get next invoice number failed: ${text}`);
  }

  return response.json();
}
