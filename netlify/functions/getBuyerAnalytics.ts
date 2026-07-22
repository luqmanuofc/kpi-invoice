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
    const buyerId = url.searchParams.get("buyerId");

    if (!buyerId) {
      return new Response(
        JSON.stringify({ error: "buyerId parameter is required" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Indian fiscal year: April 1 - March 31
    const today = new Date();
    const fiscalYearStartYear =
      today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
    const fiscalYearStart = new Date(fiscalYearStartYear, 3, 1);
    const fiscalYearEnd = new Date(fiscalYearStartYear + 1, 3, 1);
    const lastFiscalYearStart = new Date(fiscalYearStartYear - 1, 3, 1);

    const DAY_MS = 24 * 60 * 60 * 1000;
    // Days elapsed in the current fiscal year so far (inclusive of today).
    const daysElapsedInFY =
      Math.floor((today.getTime() - fiscalYearStart.getTime()) / DAY_MS) + 1;
    // Same elapsed window, one fiscal year earlier — for a like-for-like
    // year-to-date comparison instead of "partial year vs full year".
    const lastFiscalYearToDateEnd = new Date(
      lastFiscalYearStart.getTime() + daysElapsedInFY * DAY_MS
    );

    // Every month of the current fiscal year so far (Apr -> current month),
    // oldest first.
    const monthsElapsedInFY =
      (today.getFullYear() - fiscalYearStart.getFullYear()) * 12 +
      (today.getMonth() - fiscalYearStart.getMonth()) +
      1;
    const monthStarts = Array.from(
      { length: monthsElapsedInFY },
      (_, i) => new Date(fiscalYearStartYear, 3 + i, 1)
    );

    const [
      lifetimeStats,
      thisFiscalYearInvoiceCount,
      fiscalYearRevenue,
      lastFiscalYearToDateRevenue,
      monthlyRevenues,
      topProductsData,
    ] = await Promise.all([
      prisma.invoice.aggregate({
        where: { buyerId, status: { in: ["PENDING", "PAID", "CHEQUE_ISSUED"] } },
        _count: true,
        _min: { date: true },
        _max: { date: true },
      }),

      prisma.invoice.count({
        where: {
          buyerId,
          date: { gte: fiscalYearStart, lt: fiscalYearEnd },
          status: { in: ["PENDING", "PAID", "CHEQUE_ISSUED"] },
        },
      }),

      prisma.invoice.aggregate({
        where: {
          buyerId,
          date: { gte: fiscalYearStart, lt: fiscalYearEnd },
          status: { in: ["PENDING", "PAID", "CHEQUE_ISSUED"] },
        },
        _sum: { total: true },
      }),

      prisma.invoice.aggregate({
        where: {
          buyerId,
          date: { gte: lastFiscalYearStart, lt: lastFiscalYearToDateEnd },
          status: { in: ["PENDING", "PAID", "CHEQUE_ISSUED"] },
        },
        _sum: { total: true },
      }),

      Promise.all(
        monthStarts.map((start) => {
          const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
          return prisma.invoice.aggregate({
            where: {
              buyerId,
              date: { gte: start, lt: end },
              status: { in: ["PENDING", "PAID", "CHEQUE_ISSUED"] },
            },
            _sum: { total: true },
          });
        })
      ),

      prisma.invoiceItem.groupBy({
        by: ["description", "unit"],
        where: {
          invoice: {
            buyerId,
            date: { gte: fiscalYearStart, lt: fiscalYearEnd },
            status: { in: ["PENDING", "PAID", "CHEQUE_ISSUED"] },
          },
        },
        _sum: { lineTotal: true, qty: true },
        orderBy: { _sum: { lineTotal: "desc" } },
        take: 5,
      }),
    ]);

    const revenueChart = monthStarts.map((start, i) => ({
      month: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`,
      revenue: Number(monthlyRevenues[i]._sum.total || 0),
    }));

    const topProducts = topProductsData.map((p) => ({
      name: p.description,
      unit: p.unit,
      qty: Number(p._sum.qty || 0),
      revenue: Number(p._sum.lineTotal || 0),
    }));

    const lifetimeInvoiceCount = lifetimeStats._count;

    // Average days between invoices: total span from first to last invoice
    // divided by the number of gaps (count - 1).
    let avgCadenceDays: number | null = null;
    if (
      lifetimeInvoiceCount >= 2 &&
      lifetimeStats._min.date &&
      lifetimeStats._max.date
    ) {
      const spanMs =
        lifetimeStats._max.date.getTime() - lifetimeStats._min.date.getTime();
      avgCadenceDays =
        spanMs / (1000 * 60 * 60 * 24) / (lifetimeInvoiceCount - 1);
    }

    const daysSinceLastInvoice = lifetimeStats._max.date
      ? Math.floor(
          (today.getTime() - lifetimeStats._max.date.getTime()) / DAY_MS
        )
      : null;

    const lastFyToDateRevenue = Number(lastFiscalYearToDateRevenue._sum.total || 0);
    const thisFyRevenue = Number(fiscalYearRevenue._sum.total || 0);

    // Skip the comparison in the first week of a new fiscal year — with so
    // little elapsed, a "100% down" reading is just noise, not a signal.
    const yoyChangePct =
      daysElapsedInFY >= 7 && lastFyToDateRevenue > 0
        ? ((thisFyRevenue - lastFyToDateRevenue) / lastFyToDateRevenue) * 100
        : null;

    return new Response(
      JSON.stringify({
        lifetimeInvoiceCount,
        thisFiscalYearInvoiceCount,
        fiscalYearRevenue: thisFyRevenue,
        lastFiscalYearToDateRevenue: lastFyToDateRevenue,
        yoyChangePct,
        avgCadenceDays,
        daysSinceLastInvoice,
        revenueChart,
        topProducts,
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
