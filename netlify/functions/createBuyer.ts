import prisma from "../lib/prisma";

export default async function handler(request: Request) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const data = await request.json();

    const buyer = await prisma.buyer.create({
      data: {
        name: data.name,
        address: data.address,
        gstin: data.gstin || null,
        phone: data.phone || null,
      },
    });

    return new Response(JSON.stringify(buyer), {
      status: 201,
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
