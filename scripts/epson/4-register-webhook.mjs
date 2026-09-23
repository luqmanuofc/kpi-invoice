// One-time (or re-run-when-the-URL-changes) step: tells Epson where to push
// print job status changes. Uses an "application token" (client-credentials
// grant) -- a different credential than the device token everything else in
// this app uses, and one that doesn't need a browser or a registered printer.
//
// Run from the project root, so it picks up the repo's .env:
//   node scripts/epson/4-register-webhook.mjs https://your-deployed-site/.netlify/functions/epsonJobWebhook
//
// Epson can't reach localhost/127.0.0.1, so this only works with a real,
// publicly reachable URL -- i.e. only after deploying.

import "dotenv/config";

const CLIENT_ID = process.env.EPSON_CLIENT_ID;
const CLIENT_SECRET = process.env.EPSON_CLIENT_SECRET;
const API_KEY = process.env.EPSON_API_KEY;
const callbackUri = process.argv[2];

if (!CLIENT_ID || !CLIENT_SECRET || !API_KEY) {
  console.error("Set EPSON_CLIENT_ID, EPSON_CLIENT_SECRET, and EPSON_API_KEY in .env first.");
  process.exit(1);
}

if (!callbackUri) {
  console.error(
    "Usage: node scripts/epson/4-register-webhook.mjs https://your-deployed-site/.netlify/functions/epsonJobWebhook"
  );
  process.exit(1);
}

if (callbackUri.includes("localhost") || callbackUri.includes("127.0.0.1")) {
  console.error("That's a local URL -- Epson's servers can't reach it. Deploy first.");
  process.exit(1);
}

console.log("1) Getting an application token (client_credentials grant)...");
const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
const tokenRes = await fetch("https://auth.epsonconnect.com/auth/token", {
  method: "POST",
  headers: {
    Authorization: `Basic ${basic}`,
    "Content-Type": "application/x-www-form-urlencoded",
  },
  body: new URLSearchParams({ grant_type: "client_credentials" }).toString(),
});
const tokenData = await tokenRes.json();
if (!tokenRes.ok) {
  console.error(`Failed (HTTP ${tokenRes.status}):`, tokenData);
  process.exit(1);
}
console.log("   got application token");

console.log(`2) Registering callback URI: ${callbackUri}`);
const registerRes = await fetch(
  "https://api.epsonconnect.com/api/2/printing/settings/notification",
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      "x-api-key": API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ notification: true, callbackUri }),
  }
);

if (registerRes.status !== 204) {
  console.error(`Registration failed (HTTP ${registerRes.status}):`, await registerRes.text());
  process.exit(1);
}

console.log("Done -- Epson will now push job status changes to that URL.");
