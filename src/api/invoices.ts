import type { InvoiceForm } from "../invoice-form/types";

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
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
  amountInWords: string;
  createdAt: string;
  updatedAt: string;
  buyer?: {
    id: string;
    name: string;
    address: string;
    gstin: string | null;
    phone: string | null;
  };
  items?: Array<{
    id: string;
    description: string;
    hsn: string;
    qty: number;
    unit: string;
    rate: number;
    lineTotal: number;
  }>;
}

export async function createInvoice(data: InvoiceForm) {
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

export async function getInvoices(): Promise<Invoice[]> {
  const response = await fetch("/.netlify/functions/getInvoices", {
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
