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
