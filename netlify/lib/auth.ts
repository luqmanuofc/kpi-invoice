import { createHash } from "crypto";

const APP_PASSWORD = process.env.APP_PASSWORD;

if (!APP_PASSWORD) {
  throw new Error("APP_PASSWORD environment variable is required but not set");
}

// Hash the APP_PASSWORD to compare with client-side hash
const APP_PASSWORD_HASH = createHash("sha256")
  .update(APP_PASSWORD)
  .digest("hex");

export function validateAuth(request: Request): boolean {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader) {
    return false;
  }

  const tokenHash = authHeader.replace("Bearer ", "");
  return tokenHash === APP_PASSWORD_HASH;
}

export function unauthorizedResponse(): Response {
  return new Response("Unauthorized", { status: 401 });
}
