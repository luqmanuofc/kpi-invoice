import prisma from "../lib/prisma";

export default async function handler(request: Request) {
  if (request.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const url = new URL(request.url);
  const invoiceId = url.searchParams.get("invoiceId");

  if (!invoiceId) {
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

  try {
    const logs = await prisma.invoiceStatusLog.findMany({
      where: {
        invoiceId: invoiceId,
      },
      orderBy: {
        changedAt: "desc",
      },
    });

    // Map status to lowercase for frontend
    const logsWithLowercaseStatus = logs.map((log) => ({
      ...log,
      oldStatus: log.oldStatus.toLowerCase(),
      newStatus: log.newStatus.toLowerCase(),
    }));

    return new Response(JSON.stringify(logsWithLowercaseStatus), {
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
