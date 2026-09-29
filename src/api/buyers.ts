import { apiClient } from "../utils/auth";

export interface GstVerificationGoodsService {
  hsn: string;
  description: string;
  type: "goods" | "service";
}

/** Everything scripts/gstin-lookup captured on its most recent run that isn't
 * worth its own typed column -- see the `raw` column comment in schema.prisma. */
export interface GstVerificationRaw {
  adminOffice?: string[];
  otherOffice?: string[];
  natureOfCoreBusinessActivity?: string | null;
  natureOfBusinessActivities?: string[];
  goodsServices?: GstVerificationGoodsService[];
  fullText?: string | null;
}

/** One row from the GstVerification table -- full detail behind a single
 * scripts/gstin-lookup run. getBuyer only ever returns the latest one. */
export interface GstVerificationDetail {
  id: string;
  gstin: string;
  verifiedAt: string;
  legalName: string | null;
  tradeName: string | null;
  registrationDate: string | null;
  constitutionOfBusiness: string | null;
  gstinStatus: string | null;
  taxpayerType: string | null;
  principalAddress: string | null;
  pincode: number | null;
  stateCode: number | null;
  raw: GstVerificationRaw | null;
}

export interface Buyer {
  id: string;
  name: string;
  address: string;
  gstin: string | null;
  phone: string | null;
  pincode: number | null;
  stateCode: number | null;
  // Set only by scripts/gstin-lookup, never by the buyer form -- see that
  // script and netlify/functions/updateBuyer.ts. gstVerifiedAt non-null is
  // what "verified" means -- shown on the buyer detail page's GST Info card.
  // Informational only: e-way bill generation isn't gated on this (see
  // EWAY_BILL.md), just on the invoice's own data being valid.
  gstVerifiedAt: string | null;
  gstLegalName: string | null;
  gstTradeName: string | null;
  gstAddress: string | null;
  // Only populated by getBuyerById (a join); the buyer list doesn't fetch
  // this. Latest verification only -- full history lives in the table.
  gstVerifications?: GstVerificationDetail[];
  createdAt: string;
  updatedAt: string;
}

/** True once a buyer's GSTIN has been confirmed against the government's own data. */
export function isBuyerGstVerified(buyer: Pick<Buyer, "gstVerifiedAt">): boolean {
  return buyer.gstVerifiedAt !== null;
}

export interface BuyerFormData {
  name: string;
  address: string;
  gstin?: string;
  phone?: string;
  pincode?: number | null;
  stateCode?: number | null;
}

export async function createBuyer(data: BuyerFormData) {
  const response = await apiClient("/.netlify/functions/createBuyer", {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Create buyer failed: ${text}`);
  }

  return response.json();
}

export async function getBuyers(): Promise<Buyer[]> {
  const response = await apiClient("/.netlify/functions/getBuyers", {
    method: "GET",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Get buyers failed: ${text}`);
  }

  return response.json();
}

export async function getBuyerById(id: string): Promise<Buyer> {
  const response = await apiClient(`/.netlify/functions/getBuyer?id=${id}`, {
    method: "GET",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Get buyer failed: ${text}`);
  }

  return response.json();
}

export interface BuyerAnalytics {
  lifetimeInvoiceCount: number;
  thisFiscalYearInvoiceCount: number;
  fiscalYearRevenue: number;
  lastFiscalYearToDateRevenue: number;
  yoyChangePct: number | null;
  avgCadenceDays: number | null;
  daysSinceLastInvoice: number | null;
  revenueChart: Array<{ month: string; revenue: number }>;
  topProducts: Array<{
    name: string;
    unit: string;
    qty: number;
    revenue: number;
  }>;
}

export async function getBuyerAnalytics(id: string): Promise<BuyerAnalytics> {
  const response = await apiClient(
    `/.netlify/functions/getBuyerAnalytics?buyerId=${id}`,
    {
      method: "GET",
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Get buyer analytics failed: ${text}`);
  }

  return response.json();
}

export async function updateBuyer(id: string, data: BuyerFormData) {
  const response = await apiClient("/.netlify/functions/updateBuyer", {
    method: "PUT",
    body: JSON.stringify({ id, ...data }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Update buyer failed: ${text}`);
  }

  return response.json();
}
