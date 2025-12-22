import prisma from "../lib/prisma";
import { validateAuth, unauthorizedResponse } from "../lib/auth";

export default async function handler(request: Request) {
  if (!validateAuth(request)) {
    return unauthorizedResponse();
  }

  if (request.method !== "PUT") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const data = await request.json();

    if (!data.id) {
      return new Response(
        JSON.stringify({ error: "Invoice ID is required" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Get the current invoice to check the old status
    const currentInvoice = await prisma.invoice.findUnique({
      where: { id: data.id },
    });

    if (!currentInvoice) {
      return new Response(JSON.stringify({ error: "Invoice not found" }), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Check if already archived
    if (currentInvoice.status === "ARCHIVED") {
      return new Response(
        JSON.stringify({ error: "Invoice is already archived" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Create new invoice number: <original_invoice_number>__archived__<invoice_id>
    const newInvoiceNumber = `${currentInvoice.invoiceNumber}__archived__${currentInvoice.id}`;

    // Update invoice status to ARCHIVED and update invoice number in a transaction
    const [updatedInvoice] = await prisma.$transaction([
      prisma.invoice.update({
        where: {
          id: data.id,
        },
        data: {
          status: "ARCHIVED",
          invoiceNumber: newInvoiceNumber,
        },
        include: {
          items: true,
        },
      }),
      prisma.invoiceStatusLog.create({
        data: {
          invoiceId: data.id,
          oldStatus: currentInvoice.status,
          newStatus: "ARCHIVED",
        },
      }),
    ]);

    // Map status to lowercase for frontend
    const invoiceWithLowercaseStatus = {
      ...updatedInvoice,
      status: updatedInvoice.status.toLowerCase(),
    };

    return new Response(JSON.stringify(invoiceWithLowercaseStatus), {
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
