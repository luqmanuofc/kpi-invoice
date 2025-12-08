export interface BuyerFormData {
  name: string;
  address: string;
  gstin?: string;
  phone?: string;
}

export interface Buyer {
  id: string;
  name: string;
  address: string;
  gstin: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
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
