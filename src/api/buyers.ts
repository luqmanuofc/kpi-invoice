import type { Buyer } from "../invoice-form/types";

export type { Buyer };

export interface BuyerFormData {
  name: string;
  address: string;
  gstin?: string;
  phone?: string;
}

export async function createBuyer(data: BuyerFormData) {
  const response = await fetch("/.netlify/functions/createBuyer", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Create buyer failed: ${text}`);
  }

  return response.json();
}

export async function getBuyers(): Promise<Buyer[]> {
  const response = await fetch("/.netlify/functions/getBuyers", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Get buyers failed: ${text}`);
  }

  return response.json();
}

export async function getBuyerById(id: string): Promise<Buyer> {
  const response = await fetch(`/.netlify/functions/getBuyer?id=${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Get buyer failed: ${text}`);
  }

  return response.json();
}

export async function updateBuyer(id: string, data: BuyerFormData) {
  const response = await fetch("/.netlify/functions/updateBuyer", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id, ...data }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Update buyer failed: ${text}`);
  }

  return response.json();
}
