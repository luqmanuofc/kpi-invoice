// Writes the tokens from tokens.json (produced by 1-auth-setup.mjs) into the
// app's EpsonConnection table, so netlify/lib/epson.ts has something to
// refresh from without going through the browser flow again.
//
// Run from the project root (so dotenv picks up the repo's .env):
//   node scripts/epson/3-seed-app-db.mjs

import "dotenv/config";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import pg from "pg";

const TOKENS_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "tokens.json"
);

const tokens = JSON.parse(await readFile(TOKENS_PATH, "utf8"));

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set -- run this from the project root with a populated .env.");
  process.exit(1);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
await client.query(
  `INSERT INTO "EpsonConnection" (id, "accessToken", "refreshToken", "accessTokenExpiresAt", "refreshedAt", "createdAt")
   VALUES ('singleton', $1, $2, $3, now(), now())
   ON CONFLICT (id) DO UPDATE SET
     "accessToken" = EXCLUDED."accessToken",
     "refreshToken" = EXCLUDED."refreshToken",
     "accessTokenExpiresAt" = EXCLUDED."accessTokenExpiresAt",
     "refreshedAt" = now()`,
  [tokens.access_token, tokens.refresh_token, tokens.expires_at]
);
await client.end();

console.log("Seeded EpsonConnection from", TOKENS_PATH);
console.log("Access token expires:", tokens.expires_at);
