// Proves the actual print pipeline works: create job -> upload file ->
// execute -> poll status until terminal. Uses whatever access token
// 1-auth-setup.mjs saved, refreshing it first if it's expired.
//
// Required env vars:
//   EPSON_CLIENT_ID
//   EPSON_CLIENT_SECRET
//   EPSON_API_KEY        (the "API Key" shown on your app page, separate from
//                          client id/secret)
//
// Run from the project root, so it picks up the repo's .env:
//   node scripts/epson/2-print-test.mjs /path/to/some.pdf

import "dotenv/config";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const CLIENT_ID = process.env.EPSON_CLIENT_ID;
const CLIENT_SECRET = process.env.EPSON_CLIENT_SECRET;
const API_KEY = process.env.EPSON_API_KEY;
const filePath = process.argv[2];

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const TOKENS_PATH = path.join(SCRIPT_DIR, "tokens.json");

if (!CLIENT_ID || !CLIENT_SECRET || !API_KEY) {
  console.error(
    "Set EPSON_CLIENT_ID, EPSON_CLIENT_SECRET, and EPSON_API_KEY env vars first."
  );
  process.exit(1);
}

if (!filePath) {
  console.error("Usage: node 2-print-test.mjs /path/to/some.pdf");
  process.exit(1);
}

async function loadTokens() {
  const raw = await readFile(TOKENS_PATH, "utf8");
  return JSON.parse(raw);
}

async function saveTokens(tokens) {
  await writeFile(TOKENS_PATH, JSON.stringify(tokens, null, 2));
}

async function refreshTokens(tokens) {
  console.log("Access token expired (or close to it) -- refreshing...");
  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString(
    "base64"
  );
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: tokens.refresh_token,
  });

  const res = await fetch("https://auth.epsonconnect.com/auth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("Refresh failed:", data);
    process.exit(1);
  }

  const updated = {
    ...tokens,
    ...data, // Epson rotates the refresh_token -- always persist whatever comes back.
    obtained_at: new Date().toISOString(),
    expires_at: new Date(
      Date.now() + (data.expires_in ?? 3600) * 1000
    ).toISOString(),
  };
  await saveTokens(updated);
  console.log("Refreshed and saved new tokens.\n");
  return updated;
}

async function getValidTokens() {
  let tokens = await loadTokens();
  const expiresAt = new Date(tokens.expires_at).getTime();
  if (Date.now() > expiresAt - 60_000) {
    tokens = await refreshTokens(tokens);
  }
  return tokens;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const tokens = await getValidTokens();
  const accessToken = tokens.access_token;

  console.log("1) Fetching this printer's default print capability...");
  const capRes = await fetch(
    "https://api.epsonconnect.com/api/2/printing/capability/default",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "x-api-key": API_KEY,
      },
    }
  );
  const capData = await capRes.json();
  if (!capRes.ok) {
    console.error(`Get capability failed (HTTP ${capRes.status}):`, capData);
    process.exit(1);
  }
  console.log("   device defaults:", JSON.stringify(capData.printSettings));

  console.log("2) Creating print job...");
  const createRes = await fetch(
    "https://api.epsonconnect.com/api/2/printing/jobs",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "x-api-key": API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jobName: `poc-test-${Date.now()}`,
        printMode: "document",
        printSettings: capData.printSettings,
      }),
    }
  );

  const createData = await createRes.json();
  if (!createRes.ok) {
    console.error(`Create job failed (HTTP ${createRes.status}):`, createData);
    process.exit(1);
  }
  console.log("   jobId:", createData.jobId);

  console.log("3) Uploading file...");
  const ext = path.extname(filePath).replace(".", "") || "pdf";
  const fileBuffer = await readFile(filePath);
  const uploadUrl = `${createData.uploadUri}&File=1.${ext}`;

  const uploadRes = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": "application/pdf" },
    body: fileBuffer,
  });

  if (!uploadRes.ok) {
    console.error(
      `Upload failed (HTTP ${uploadRes.status}):`,
      await uploadRes.text()
    );
    process.exit(1);
  }
  console.log("   uploaded ok");

  console.log("4) Executing print...");
  const printRes = await fetch(
    `https://api.epsonconnect.com/api/2/printing/jobs/${createData.jobId}/print`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "x-api-key": API_KEY,
      },
    }
  );

  if (!printRes.ok) {
    console.error(
      `Execute print failed (HTTP ${printRes.status}):`,
      await printRes.text()
    );
    process.exit(1);
  }
  console.log("   print triggered\n");

  console.log("5) Polling job status (this is only for the POC -- the real");
  console.log("   app will use a webhook instead of polling)...\n");

  const terminalStatuses = new Set([
    "completed",
    "canceled",
    "error_occurred",
    "expired",
    "stopped_other",
    "media_empty",
    "media_jam",
    "marker_supply_empty",
  ]);

  for (let i = 0; i < 20; i++) {
    const statusRes = await fetch(
      `https://api.epsonconnect.com/api/2/printing/jobs/${createData.jobId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "x-api-key": API_KEY,
        },
      }
    );
    const statusData = await statusRes.json();
    console.log(`   [${i}] status: ${statusData.status}`);

    if (terminalStatuses.has(statusData.status)) {
      console.log("\nDone. Final job info:", JSON.stringify(statusData, null, 2));
      return;
    }

    await sleep(3000);
  }

  console.log("\nGave up polling after 60s -- check the printer/app dashboard directly.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
