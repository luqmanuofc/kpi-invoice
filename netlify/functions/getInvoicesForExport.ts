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
    const month = url.searchParams.get("month"); // Expected format: YYYY-MM

    if (!month) {
      return new Response(
        JSON.stringify({ error: "Month parameter is required (format: YYYY-MM)" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Parse the month parameter
    const [year, monthNum] = month.split("-").map(Number);

    // Create start and end dates for the month
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 1); // First day of next month

    // Fetch all invoices for the month (no pagination for export)
    const invoices = await prisma.invoice.findMany({
      where: {
        date: {
          gte: startDate,
          lt: endDate,
        },
        status: {
          in: ["PENDING", "PAID"], // Exclude archived
        },
      },
      orderBy: [
        {
          buyer: {
            name: "asc",
          },
        },
        {
          date: "asc",
        },
      ],
      select: {
        invoiceNumber: true,
        date: true,
        buyerId: true,
        buyer: {
          select: {
            name: true,
            gstin: true,
          },
        },
        subtotal: true,
        cgstAmount: true,
        sgstAmount: true,
        igstAmount: true,
        total: true,
      },
    });

    // Transform to simplified format for CSV
    const exportData = invoices.map((invoice) => ({
      invoiceNumber: invoice.invoiceNumber,
      date: invoice.date,
      buyerId: invoice.buyerId,
      buyerName: invoice.buyer.name,
      buyerGstin: invoice.buyer.gstin || "",
      subtotal: Number(invoice.subtotal),
      cgstAmount: Number(invoice.cgstAmount),
      sgstAmount: Number(invoice.sgstAmount),
      igstAmount: Number(invoice.igstAmount),
      total: Number(invoice.total),
    }));

    return new Response(JSON.stringify({ invoices: exportData }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
