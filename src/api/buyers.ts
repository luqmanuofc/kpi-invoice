import { apiClient } from "../utils/auth";

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
  // what "verified" means (gate for e-way bill bulk-JSON generation).
  gstVerifiedAt: string | null;
  gstLegalName: string | null;
  gstTradeName: string | null;
  gstAddress: string | null;
  createdAt: string;
  updatedAt: string;
}

/** True once a buyer's GSTIN has been confirmed against the government's own data. */
export function isBuyerGstVerified(buyer: Pick<Buyer, "gstVerifiedAt">): boolean {
  return buyer.gstVerifiedAt !== null;
}

/**
 * True when an invoice needs an e-way bill and its buyer has a GSTIN that
 * hasn't been verified yet -- e-way bill generation is blocked until then
 * (see EWAY_BILL.md). Buyers with no GSTIN (URP) aren't gated: there's no
 * registration to verify against.
 */
export function blockedByGstVerification(
  ewayRequired: boolean,
  buyer: Pick<Buyer, "gstin" | "gstVerifiedAt"> | undefined
): boolean {
  return ewayRequired && !!buyer?.gstin && !isBuyerGstVerified(buyer);
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
