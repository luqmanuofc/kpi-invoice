import prisma from "../lib/prisma";

export default async function handler(request: Request) {
  if (request.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const url = new URL(request.url);
    const buyerId = url.searchParams.get("buyerId");
    const productId = url.searchParams.get("productId");
    const page = parseInt(url.searchParams.get("page") || "1");
    const pageSize = parseInt(url.searchParams.get("pageSize") || "10");

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

    return new Response(
      JSON.stringify({
        invoices,
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
