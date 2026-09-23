import prisma from "../lib/prisma";

// Called by Epson's cloud, not by our own frontend -- there is no JWT here,
// and Epson's notification API doesn't offer a way to sign/verify the
// callback. We limit the blast radius of that by only ever updating a
// PrintJob row that already exists for the given JobId; an unrecognized
// JobId is just ignored rather than creating anything.
export default async function handler(request: Request) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await request.json();
    const jobId = body?.Param?.JobId;
    const jobStatus = body?.Param?.JobStatus;

    if (typeof jobId === "string" && typeof jobStatus === "string") {
      await prisma.epsonPrintJob.updateMany({
        where: { epsonJobId: jobId },
        data: { status: jobStatus },
      });
    }

    return new Response(null, { status: 200 });
  } catch (err: any) {
    console.error("epsonJobWebhook error:", err);
    // Still 200 -- there's nothing Epson can do with a retry here, and we
    // don't want it endlessly retrying a payload we can't parse.
    return new Response(null, { status: 200 });
  }
}
