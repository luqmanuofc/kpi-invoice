// Plain node:http server -- only 3 routes, no framework needed. Reached
// from the internet only via Tailscale Funnel (see README.md), and only
// ever called by the app's two Netlify functions (startGstLookup.ts,
// submitGstCaptcha.ts), never directly by a browser -- so auth here is one
// static shared secret, not the app's user-facing JWT.

import "dotenv/config";
import http from "node:http";
import { startSession, answerSession, closeAllSessions } from "./sessions.mjs";

const PORT = process.env.PORT || 3000;
const SHARED_SECRET = process.env.WORKER_SHARED_SECRET;

if (!SHARED_SECRET) {
  console.error("WORKER_SHARED_SECRET is not set -- refusing to start.");
  process.exit(1);
}

const GSTIN_RE = /^[0-9A-Z]{15}$/;

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

function sendJson(res, status, body) {
  const json = JSON.stringify(body);
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(json);
}

function isAuthorized(req) {
  return req.headers["authorization"] === `Bearer ${SHARED_SECRET}`;
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url === "/health") {
      sendJson(res, 200, { ok: true });
      return;
    }

    if (!isAuthorized(req)) {
      sendJson(res, 401, { error: "Unauthorized" });
      return;
    }

    if (req.method === "POST" && req.url === "/lookup/start") {
      const body = JSON.parse((await readBody(req)) || "{}");
      const gstin = String(body.gstin || "").trim().toUpperCase();
      if (!GSTIN_RE.test(gstin)) {
        sendJson(res, 400, { error: "Invalid GSTIN (need 15 characters)" });
        return;
      }
      const { sessionId, captchaImage } = await startSession(gstin);
      sendJson(res, 200, { sessionId, captchaImage: captchaImage.toString("base64") });
      return;
    }

    if (req.method === "POST" && req.url === "/lookup/answer") {
      const body = JSON.parse((await readBody(req)) || "{}");
      const sessionId = String(body.sessionId || "");
      const answer = String(body.answer || "").trim();
      if (!sessionId || !answer) {
        sendJson(res, 400, { error: "sessionId and answer are required" });
        return;
      }
      const result = await answerSession(sessionId, answer);
      if (result.captchaImage) {
        result.captchaImage = result.captchaImage.toString("base64");
      }
      sendJson(res, 200, result);
      return;
    }

    sendJson(res, 404, { error: "Not found" });
  } catch (err) {
    console.error(err);
    sendJson(res, 500, { error: err instanceof Error ? err.message : "Internal error" });
  }
});

server.listen(PORT, () => {
  console.log(`gst-worker listening on :${PORT}`);
});

async function shutdown(signal) {
  console.log(`${signal} received, closing open sessions...`);
  await closeAllSessions();
  server.close(() => process.exit(0));
  // Force-exit if something's still holding the process open after 5s.
  setTimeout(() => process.exit(0), 5000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
