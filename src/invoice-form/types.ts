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

  buyerName: string;
  buyerAddress: string;
  buyerGstin: string;

  items: InvoiceItem[];

  discount: number;
  cgst: number;
  sgst: number;
  igst: number;

  // NEW TOTAL SECTIONS (computed automatically)
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
