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
      return new Response(JSON.stringify({ error: "Buyer ID is required" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    const newGstin = data.gstin || null;

    // A GST verification is only valid for the GSTIN it was run against --
    // if the GSTIN changes, un-verify rather than leave a stale "verified"
    // badge pointing at another business's confirmed data. Re-run
    // scripts/gstin-lookup to re-verify.
    const existing = await prisma.buyer.findUnique({
      where: { id: data.id },
      select: { gstin: true },
    });
    const gstinChanged = existing !== null && existing.gstin !== newGstin;

    const buyer = await prisma.buyer.update({
      where: {
        id: data.id,
      },
      data: {
        name: data.name,
        address: data.address,
        gstin: newGstin,
        phone: data.phone || null,
        pincode: data.pincode ?? null,
        stateCode: data.stateCode ?? null,
        ...(gstinChanged ? { gstVerifiedAt: null } : {}),
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
