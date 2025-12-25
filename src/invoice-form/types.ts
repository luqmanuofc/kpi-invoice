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
  productId: string;
  description: string;
  hsn: string;
  qty: number;
  unit: string;
  rate: number;
  lineTotal: number;
};

export type InvoiceForm = {
  id: string | null;
  invoiceNumber: string;
  vehicleNumber: string;
  date: string;

  buyer: Buyer | null;

  items: InvoiceItem[];

  discount: number;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;

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
