import { getAuthHeaders } from "../utils/auth";

export interface DashboardMetrics {
  totalInvoices: number;
  totalRevenue: number;
  month: string;
}

export async function getDashboardMetrics(
  month: string
): Promise<DashboardMetrics> {
  const url = `/.netlify/functions/getDashboardMetrics?month=${month}`;

  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Get dashboard metrics failed: ${text}`);
  }

  return response.json();
}
