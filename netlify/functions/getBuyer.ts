import prisma from "../lib/prisma";

export default async function handler(request: Request) {
  if (request.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return new Response(JSON.stringify({ error: "Buyer ID is required" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    const buyer = await prisma.buyer.findUnique({
      where: {
        id: id,
      },
    });

    if (!buyer) {
      return new Response(JSON.stringify({ error: "Buyer not found" }), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

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
