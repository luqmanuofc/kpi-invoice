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
    const productId = url.searchParams.get("productId");
    const page = parseInt(url.searchParams.get("page") || "1");
    const pageSize = parseInt(url.searchParams.get("pageSize") || "10");

    // New filter parameters
    const invoiceNumber = url.searchParams.get("invoiceNumber");
    const status = url.searchParams.get("status");
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");

    // Build the where clause
    const where: any = {};
    if (buyerId) {
      where.buyerId = buyerId;
    }
    if (productId) {
      where.items = {
        some: {
          productId: productId,
        },
      };
    }

    // Filter by invoice number (partial match, case-insensitive)
    if (invoiceNumber) {
      where.invoiceNumber = {
        contains: invoiceNumber,
        mode: "insensitive",
      };
    }
    // Filter by status
    if (status) {
      where.status = status.toUpperCase();
    } else {
      // By default, exclude archived invoices
      where.status = {
        not: "ARCHIVED",
      };
    }

    // Filter by date range
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        // Add one day to include the end date
        const endDateObj = new Date(endDate);
        endDateObj.setDate(endDateObj.getDate() + 1);
        where.date.lt = endDateObj;
      }
    }

    // Calculate pagination
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    // Fetch invoices with pagination
    const [invoices, totalCount] = await Promise.all([
      prisma.invoice.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          buyer: true,
          items: true,
        },
        skip,
        take,
      }),
      prisma.invoice.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / pageSize);

    // Map status to lowercase for frontend
    const invoicesWithLowercaseStatus = invoices.map((invoice) => ({
      ...invoice,
      status: invoice.status.toLowerCase(),
    }));

    return new Response(
      JSON.stringify({
        invoices: invoicesWithLowercaseStatus,
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages,
        },
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
