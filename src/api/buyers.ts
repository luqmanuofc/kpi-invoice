import { apiClient } from "../utils/auth";

export interface Buyer {
  id: string;
  name: string;
  address: string;
  gstin: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
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
