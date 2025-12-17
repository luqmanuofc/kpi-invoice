import type { InvoiceForm } from "../invoice-form/types";

export interface Invoice {
  id: string;
  invoiceNumber: string;
  vehicleNumber: string;
  date: string;

  buyerId: string;
  buyerNameSnapshot: string;
  buyerAddressSnapshot: string;
  buyerGstinSnapshot: string | null;
  buyerPhontSnapshot: string | null;

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

  status: "pending" | "paid" | "void";
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
  status?: "pending" | "paid" | "void";
  startDate?: string;
  endDate?: string;
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
  if (params?.invoiceNumber) {
    searchParams.append("invoiceNumber", params.invoiceNumber);
  }
  if (params?.status) {
    searchParams.append("status", params.status);
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

export async function checkInvoiceNumber(
  invoiceNumber: string
): Promise<{ exists: boolean }> {
  const response = await fetch(
    `/.netlify/functions/checkInvoiceNumber?invoiceNumber=${encodeURIComponent(
      invoiceNumber
    )}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
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
  status: "pending" | "paid" | "void"
): Promise<Invoice> {
  const statusMap = {
    pending: "PENDING",
    paid: "PAID",
    void: "VOID",
  };

  const response = await fetch("/.netlify/functions/updateInvoiceStatus", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id,
      status: statusMap[status],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Update invoice status failed: ${text}`);
  }

  return response.json();
}

export interface InvoiceStatusLog {
  id: string;
  invoiceId: string;
  oldStatus: "pending" | "paid" | "void";
  newStatus: "pending" | "paid" | "void";
  changedAt: string;
}

export async function getInvoiceStatusLogs(
  invoiceId: string
): Promise<InvoiceStatusLog[]> {
  const response = await fetch(
    `/.netlify/functions/getInvoiceStatusLogs?invoiceId=${invoiceId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Get invoice status logs failed: ${text}`);
  }

  return response.json();
}
