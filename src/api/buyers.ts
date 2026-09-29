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
  // Only populated by getBuyerById (a join); the buyer list doesn't fetch
  // this. Latest verification only -- full history lives in the table.
  // This is the only source of e-way ship-to PIN/state (via
  // latestGstVerification below); Buyer itself has no pincode/stateCode --
  // a buyer with no GSTIN isn't currently supported for e-way generation.
  gstVerifications?: GstVerificationDetail[];
  createdAt: string;
  updatedAt: string;
}

/**
 * The latest GstVerification row, but only if it's still for the buyer's
 * current GSTIN -- editing a buyer's GSTIN doesn't touch GstVerification,
 * so a stale row for an old GSTIN must not be mistaken for current data.
 * This is the single source of truth for a GSTIN buyer's legal/trade name,
 * address, and ship-to PIN/state; nothing GST-related is cached on Buyer.
 */
export function latestGstVerification(
  buyer: Pick<Buyer, "gstin" | "gstVerifications">
): GstVerificationDetail | undefined {
  const latest = buyer.gstVerifications?.[0];
  return latest && latest.gstin === buyer.gstin ? latest : undefined;
}

/** True once a buyer's *current* GSTIN has been confirmed against the
 * government's own data (see latestGstVerification for the GSTIN-match rule). */
export function isBuyerGstVerified(
  buyer: Pick<Buyer, "gstin" | "gstVerifications">
): boolean {
  return !!latestGstVerification(buyer);
}

export interface BuyerFormData {
  name: string;
  address: string;
  gstin?: string;
  phone?: string;
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
