import prisma from "../lib/prisma";

export default async function handler(request: Request) {
  if (request.method !== "PUT") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const data = await request.json();

    if (!data.id) {
      return new Response(JSON.stringify({ error: "Buyer ID is required" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    const buyer = await prisma.buyer.update({
      where: {
        id: data.id,
      },
      data: {
        name: data.name,
        address: data.address,
        gstin: data.gstin || null,
        phone: data.phone || null,
      },
    });

    return new Response(JSON.stringify(buyer), {
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
