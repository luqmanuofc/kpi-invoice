import { ZodError } from "zod";
import prisma from "../lib/prisma";
import { validateAuth, unauthorizedResponse } from "../lib/auth";
import { getValidDeviceToken, EPSON_API_KEY } from "../lib/epson";
import {
  PrintInvoiceRequestSchema,
  IN_FLIGHT_PRINT_STATUSES,
} from "../../src/schemas/printInvoice";

// Netlify's function payload limit is the real ceiling here, well before
// Epson's own 20MB upload limit.
const MAX_BASE64_LENGTH = 6_000_000;

const EPSON_API_BASE = "https://api.epsonconnect.com/api/2";

function epsonHeaders(accessToken: string, extra?: Record<string, string>) {
  return {
    Authorization: `Bearer ${accessToken}`,
    "x-api-key": EPSON_API_KEY!,
    ...extra,
  };
}

export default async function handler(request: Request) {
  if (!validateAuth(request)) {
    return unauthorizedResponse();
  }

  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await request.json();
    const { invoiceId, fileName, pdfBase64 } =
      PrintInvoiceRequestSchema.parse(body);

    if (pdfBase64.length > MAX_BASE64_LENGTH) {
      return new Response(
        JSON.stringify({ error: "PDF is too large to send for printing" }),
        { status: 413, headers: { "Content-Type": "application/json" } }
      );
    }

    const existingInFlight = await prisma.epsonPrintJob.findFirst({
      where: {
        invoiceId,
        status: { in: [...IN_FLIGHT_PRINT_STATUSES] },
      },
    });
    if (existingInFlight) {
      return new Response(
        JSON.stringify({
          error: "A print job is already in progress for this invoice",
        }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }

    const accessToken = await getValidDeviceToken();

    const capabilityRes = await fetch(
      `${EPSON_API_BASE}/printing/capability/default`,
      { headers: epsonHeaders(accessToken) }
    );
    const capabilityData = await capabilityRes.json();
    if (!capabilityRes.ok) {
      console.error("Get print capability failed:", capabilityData);
      return new Response(
        JSON.stringify({ error: "Failed to read printer capability" }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const createRes = await fetch(`${EPSON_API_BASE}/printing/jobs`, {
      method: "POST",
      headers: epsonHeaders(accessToken, {
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({
        jobName: `invoice-${invoiceId}-${Date.now()}`,
        printMode: "document",
        printSettings: capabilityData.printSettings,
      }),
    });
    const createData = await createRes.json();
    if (!createRes.ok) {
      console.error("Create print job failed:", createData);
      return new Response(
        JSON.stringify({ error: "Failed to create print job" }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const ext = fileName.split(".").pop() || "pdf";
    const uploadRes = await fetch(`${createData.uploadUri}&File=1.${ext}`, {
      method: "POST",
      headers: { "Content-Type": "application/pdf" },
      body: Buffer.from(pdfBase64, "base64"),
    });
    if (!uploadRes.ok) {
      console.error("Upload print file failed:", await uploadRes.text());
      return new Response(
        JSON.stringify({ error: "Failed to upload invoice PDF" }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const executeRes = await fetch(
      `${EPSON_API_BASE}/printing/jobs/${createData.jobId}/print`,
      { method: "POST", headers: epsonHeaders(accessToken) }
    );
    if (!executeRes.ok) {
      console.error("Execute print failed:", await executeRes.text());
      return new Response(
        JSON.stringify({ error: "Failed to start printing" }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const printJob = await prisma.epsonPrintJob.create({
      data: {
        invoiceId,
        epsonJobId: createData.jobId,
        status: "pending",
      },
    });

    return new Response(JSON.stringify(printJob), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    if (err instanceof ZodError) {
      return new Response(
        JSON.stringify({ error: "Invalid payload", issues: err.issues }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    console.error("printInvoiceEpson error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
