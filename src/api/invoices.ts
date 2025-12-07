import type { InvoiceForm } from "../invoice-form/types";

export async function createInvoice(data: InvoiceForm) {
  const response = await fetch("/.netlify/functions/createInvoice", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Create invoice failed: ${text}`);
  }

  return response.json();
}
