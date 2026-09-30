import prisma from "../lib/prisma";
import { validateAuth, unauthorizedResponse } from "../lib/auth";

const GST_WORKER_URL = process.env.GST_WORKER_URL;
const GST_WORKER_SECRET = process.env.GST_WORKER_SECRET;

export default async function handler(request: Request) {
  if (!validateAuth(request)) {
    return unauthorizedResponse();
  }

  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!GST_WORKER_URL || !GST_WORKER_SECRET) {
    return new Response(
      JSON.stringify({ error: "GST lookup isn't configured yet" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await request.json();
    const { sessionId, answer, buyerId, gstin } = body;

    if (!sessionId || !answer || !buyerId || !gstin) {
      return new Response(
        JSON.stringify({
          error: "sessionId, answer, buyerId and gstin are all required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const workerRes = await fetch(`${GST_WORKER_URL}/lookup/answer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GST_WORKER_SECRET}`,
      },
      body: JSON.stringify({ sessionId, answer }),
    });
    const result = await workerRes.json();

    if (!workerRes.ok) {
      console.error("gst-worker /lookup/answer failed:", result);
      return new Response(
        JSON.stringify({ error: result.error || "GST lookup failed" }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    // wrong_captcha / failed / not_found: nothing to save, pass straight
    // through for the UI to react to (retry with the new captcha, show an
    // error, etc.)
    if (result.status !== "success") {
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const found = result.data;
    // Same rule as saveResult() in scripts/gstin-lookup/lookup-and-store.mjs:
    // an incomplete result isn't a verification, it's a failed one.
    if (!found.pincode || !found.stateCode) {
      return new Response(
        JSON.stringify({
          status: "incomplete",
          error:
            "The portal's result was missing a PIN code or state. Try again, or run scripts/gstin-lookup by hand to investigate.",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const verification = await prisma.gstVerification.create({
      data: {
        buyerId,
        gstin,
        legalName: found.legalName,
        tradeName: found.tradeName,
        registrationDate: found.registrationDate,
        constitutionOfBusiness: found.constitutionOfBusiness,
        gstinStatus: found.gstinStatus,
        taxpayerType: found.taxpayerType,
        principalAddress: found.address,
        pincode: found.pincode,
        stateCode: found.stateCode,
        raw: found.raw,
      },
    });

    return new Response(JSON.stringify({ status: "success", verification }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("submitGstCaptcha error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
