import prisma from "../lib/prisma";

export default async function handler(request: Request) {
  if (request.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const url = new URL(request.url);
    const invoiceNumber = url.searchParams.get("invoiceNumber");

    if (!invoiceNumber) {
      return new Response(
        JSON.stringify({ error: "invoiceNumber is required" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Check if invoice number exists
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        invoiceNumber: invoiceNumber,
      },
      select: {
        id: true,
      },
    });

    return new Response(
      JSON.stringify({
        exists: !!existingInvoice,
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
