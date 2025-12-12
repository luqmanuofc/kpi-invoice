import prisma from "../lib/prisma";

export default async function handler(request: Request) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const data = await request.json();

    const product = await prisma.product.create({
      data: {
        name: data.name,
        hsn: data.hsn,
        defaultPrice: data.defaultPrice,
        category: data.category,
      },
    });

    return new Response(JSON.stringify(product), {
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
