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

    // Fetch aggregate data for the selected month
    const [totalInvoices, revenueData] = await Promise.all([
      // Count total invoices in the month (excluding archived)
      prisma.invoice.count({
        where: {
          date: {
            gte: startDate,
            lt: endDate,
          },
          status: {
            in: ["PENDING", "PAID"],
          },
        },
      }),

      // Calculate total revenue (sum of all invoice totals)
      prisma.invoice.aggregate({
        where: {
          date: {
            gte: startDate,
            lt: endDate,
          },
          status: {
            in: ["PENDING", "PAID"],
          },
        },
        _sum: {
          total: true,
        },
      }),
    ]);

    const totalRevenue = revenueData._sum.total || 0;

    return new Response(
      JSON.stringify({
        totalInvoices,
        totalRevenue: Number(totalRevenue),
        month,
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
