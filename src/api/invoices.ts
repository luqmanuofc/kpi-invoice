import type { InvoiceForm } from "../invoice-form/types";
import type { Buyer } from "./buyers";

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  vehicleNumber: string;
  buyerId: string;
  buyerNameSnapshot: string;
  buyerAddressSnapshot: string;
  buyerGstinSnapshot: string | null;
  sellerNameSnapshot: string;
  sellerAddressSnapshot: string;
  sellerGstinSnapshot: string;
  sellerEmailSnapshot: string;
  sellerPhoneSnapshot: string;
  subtotal: number;
  discount: number;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  total: number;
  amountInWords: string;
  status: string;
  internalNote: string | null;
  createdAt: string;
  updatedAt: string;
  buyer: Buyer;
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
}

export async function createInvoice(data: InvoiceForm): Promise<Invoice> {
  const response = await fetch("/.netlify/functions/createInvoice", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Create invoice failed: ${text}`);
  }

  return response.json();
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

  const url = `/.netlify/functions/getInvoices${
    searchParams.toString() ? `?${searchParams.toString()}` : ""
  }`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Get invoices failed: ${text}`);
  }

  return response.json();
}

export async function getInvoiceById(id: string): Promise<Invoice> {
  const response = await fetch(`/.netlify/functions/getInvoice?id=${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Get invoice failed: ${text}`);
  }

  return response.json();
}
