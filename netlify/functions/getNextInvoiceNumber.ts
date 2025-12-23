import prisma from "../lib/prisma";
import { validateAuth, unauthorizedResponse } from "../lib/auth";

export default async function handler(request: Request) {
  if (!validateAuth(request)) {
    return unauthorizedResponse();
  }

  if (request.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const url = new URL(request.url);
    const prefix = url.searchParams.get("prefix") || "2025-26/";

    // Fetch all invoice numbers that start with the prefix, excluding archived invoices
    const invoices = await prisma.invoice.findMany({
      where: {
        invoiceNumber: {
          startsWith: prefix,
        },
        status: {
          not: "ARCHIVED",
        },
      },
      select: {
        invoiceNumber: true,
      },
    });

    // Extract numeric suffixes and find the max
    let maxNumber = 0;
    const prefixPattern = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\d+)$`);

    for (const invoice of invoices) {
      const match = invoice.invoiceNumber.match(prefixPattern);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) {
          maxNumber = num;
        }
      }
    }

    // Suggest the next number
    const nextNumber = maxNumber + 1;
    const nextInvoiceNumber = `${prefix}${nextNumber}`;

    return new Response(
      JSON.stringify({
        nextInvoiceNumber,
        prefix,
        nextNumber,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
