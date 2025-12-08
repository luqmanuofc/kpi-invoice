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
