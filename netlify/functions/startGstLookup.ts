import { validateAuth, unauthorizedResponse } from "../lib/auth";

// gst-worker/ -- a separate always-on process (not a Netlify Function; see
// gst-worker/README.md for why) that holds a live browser session open
// while a human solves the GST portal's captcha. This function is just a
// thin, authenticated proxy in front of it.
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
    const gstin = String(body.gstin || "").trim().toUpperCase();

    if (gstin.length !== 15) {
      return new Response(
        JSON.stringify({ error: "Please enter a valid 15 character GSTIN" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const workerRes = await fetch(`${GST_WORKER_URL}/lookup/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GST_WORKER_SECRET}`,
      },
      body: JSON.stringify({ gstin }),
    });
    const data = await workerRes.json();

    if (!workerRes.ok) {
      console.error("gst-worker /lookup/start failed:", data);
      return new Response(
        JSON.stringify({ error: data.error || "GST lookup failed to start" }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("startGstLookup error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
