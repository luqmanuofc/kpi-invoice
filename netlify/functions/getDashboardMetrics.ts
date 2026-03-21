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

    // Fetch all metrics in parallel
    const [totalInvoices, revenueData, topBuyerData, topProductData, rev2MonthsAgo, rev1MonthAgo] =
      await Promise.all([
        // Count total invoices in the month (excluding archived)
        prisma.invoice.count({
          where: {
            date: { gte: startDate, lt: endDate },
            status: { in: ["PENDING", "PAID"] },
          },
        }),

        // Total revenue for selected month
        prisma.invoice.aggregate({
          where: {
            date: { gte: startDate, lt: endDate },
            status: { in: ["PENDING", "PAID"] },
          },
          _sum: { total: true },
        }),

        // Top 5 buyers by revenue
        prisma.invoice.groupBy({
          by: ["buyerId", "buyerNameSnapshot"],
          where: {
            date: { gte: startDate, lt: endDate },
            status: { in: ["PENDING", "PAID"] },
          },
          _sum: { total: true },
          orderBy: { _sum: { total: "desc" } },
          take: 5,
        }),

        // Top product by quantity sold
        prisma.invoiceItem.groupBy({
          by: ["description"],
          where: {
            invoice: {
              date: { gte: startDate, lt: endDate },
              status: { in: ["PENDING", "PAID"] },
            },
          },
          _sum: { qty: true },
          orderBy: { _sum: { qty: "desc" } },
          take: 1,
        }),

        // Revenue for 2 months ago
        prisma.invoice.aggregate({
          where: {
            date: {
              gte: new Date(year, monthNum - 3, 1),
              lt: new Date(year, monthNum - 2, 1),
            },
            status: { in: ["PENDING", "PAID"] },
          },
          _sum: { total: true },
        }),

        // Revenue for 1 month ago
        prisma.invoice.aggregate({
          where: {
            date: {
              gte: new Date(year, monthNum - 2, 1),
              lt: new Date(year, monthNum - 1, 1),
            },
            status: { in: ["PENDING", "PAID"] },
          },
          _sum: { total: true },
        }),
      ]);

    const totalRevenue = revenueData._sum.total || 0;

    const topBuyers = topBuyerData.map((b) => ({
      name: b.buyerNameSnapshot,
      total: Number(b._sum.total || 0),
    }));

    const topProduct = topProductData[0]
      ? {
          name: topProductData[0].description,
          qty: Number(topProductData[0]._sum.qty || 0),
        }
      : null;

    // Build 3-month revenue chart (oldest to newest)
    const revenueChart = [
      {
        month: `${new Date(year, monthNum - 3, 1).getFullYear()}-${String(new Date(year, monthNum - 3, 1).getMonth() + 1).padStart(2, "0")}`,
        revenue: Number(rev2MonthsAgo._sum.total || 0),
      },
      {
        month: `${new Date(year, monthNum - 2, 1).getFullYear()}-${String(new Date(year, monthNum - 2, 1).getMonth() + 1).padStart(2, "0")}`,
        revenue: Number(rev1MonthAgo._sum.total || 0),
      },
      {
        month: month,
        revenue: Number(totalRevenue),
      },
    ];

    return new Response(
      JSON.stringify({
        totalInvoices,
        totalRevenue: Number(totalRevenue),
        month,
        topBuyers,
        topProduct,
        revenueChart,
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
