// One-time interactive step: does the OAuth "authorization_code" flow with
// scope=device, and saves the resulting device token + refresh token to
// ./tokens.json for the print-test script to use.
//
// Required env vars:
//   EPSON_CLIENT_ID
//   EPSON_CLIENT_SECRET
// Optional:
//   EPSON_AUTH_PORT (default 8934)
//
// Before running, add this exact redirect URI to your app's settings at
// https://developer.epsonconnect.com/applications/list :
//   http://127.0.0.1:8934/callback
// (Epson's redirect URI field rejects the literal string "localhost" --
// use the loopback IP instead. Change the port in both places if you
// override EPSON_AUTH_PORT.)
//
// Run from the project root, so it picks up the repo's .env:
//   node scripts/epson/1-auth-setup.mjs

import "dotenv/config";
import http from "node:http";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const CLIENT_ID = process.env.EPSON_CLIENT_ID;
const CLIENT_SECRET = process.env.EPSON_CLIENT_SECRET;
const PORT = Number(process.env.EPSON_AUTH_PORT || 8934);
const REDIRECT_URI = `http://127.0.0.1:${PORT}/callback`;
const TOKENS_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "tokens.json"
);

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    "Set EPSON_CLIENT_ID and EPSON_CLIENT_SECRET env vars first (from developer.epsonconnect.com/applications/list)."
  );
  process.exit(1);
}

const authorizeUrl =
  `https://auth.epsonconnect.com/auth/authorize` +
  `?response_type=code` +
  `&client_id=${encodeURIComponent(CLIENT_ID)}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&scope=device`;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  if (url.pathname !== "/callback") {
    res.writeHead(404).end();
    return;
  }

  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    res.writeHead(400, { "Content-Type": "text/plain" }).end(
      `Epson returned an error: ${error}`
    );
    console.error("Authorization failed:", error);
    server.close();
    process.exit(1);
  }

  if (!code) {
    res.writeHead(400, { "Content-Type": "text/plain" }).end(
      "No ?code= in callback."
    );
    return;
  }

  res
    .writeHead(200, { "Content-Type": "text/plain" })
    .end("Got the authorization code. You can close this tab and check the terminal.");

  console.log("\nReceived authorization code, exchanging for tokens...");

  try {
    const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString(
      "base64"
    );
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
    });

    const tokenRes = await fetch("https://auth.epsonconnect.com/auth/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const data = await tokenRes.json();
    console.log("\nRaw token response:");
    console.log(JSON.stringify(data, null, 2));

    if (!tokenRes.ok) {
      console.error(`\nToken exchange failed (HTTP ${tokenRes.status}).`);
      server.close();
      process.exit(1);
    }

    const record = {
      ...data,
      obtained_at: new Date().toISOString(),
      expires_at: new Date(
        Date.now() + (data.expires_in ?? 3600) * 1000
      ).toISOString(),
    };

    await writeFile(TOKENS_PATH, JSON.stringify(record, null, 2));
    console.log(`\nSaved tokens to ${TOKENS_PATH}`);
    console.log(
      "\nLook for the device id field above (subject_id / device_id / deviceId) -- 2-print-test.mjs will need it if it's not picked up automatically."
    );
  } catch (err) {
    console.error("Token exchange threw:", err);
  } finally {
    server.close();
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log("Visit this URL in a browser, logged into your Epson Connect account:\n");
  console.log(authorizeUrl);
  console.log(
    `\nWaiting for the redirect on ${REDIRECT_URI} ... (make sure that exact URI is registered on your app)`
  );
});
