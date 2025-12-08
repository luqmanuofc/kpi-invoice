export interface Buyer {
  id: string;
  name: string;
  address: string;
  gstin: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
}

export type InvoiceItem = {
  description: string;
  hsn: string;
  qty: number;
  unit: string;
  rate: number;
};

export type InvoiceForm = {
  invoiceNumber: string;
  vehicleNumber: string;
  date: string;

  buyer: Buyer | null;

  items: InvoiceItem[];

  discount: number;
  cgst: number;
  sgst: number;
  igst: number;

  subtotal: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  total: number;

  // Seller
  sellerName: string;
  sellerAddress: string;
  sellerEmail: string;
  sellerPhone: string;
  sellerGstin: string;

  // Auto-generated
  amountInWords: string;
};
