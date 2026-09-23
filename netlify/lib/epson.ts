import prisma from "./prisma";

const CLIENT_ID = process.env.EPSON_CLIENT_ID;
const CLIENT_SECRET = process.env.EPSON_CLIENT_SECRET;
export const EPSON_API_KEY = process.env.EPSON_API_KEY;

if (!CLIENT_ID) {
  throw new Error("EPSON_CLIENT_ID environment variable is required but not set");
}
if (!CLIENT_SECRET) {
  throw new Error("EPSON_CLIENT_SECRET environment variable is required but not set");
}
if (!EPSON_API_KEY) {
  throw new Error("EPSON_API_KEY environment variable is required but not set");
}

// Refresh a bit before actual expiry to avoid racing a request against the
// token dying mid-flight.
const EXPIRY_SAFETY_MARGIN_MS = 60_000;

async function refreshDeviceToken(refreshToken: string) {
  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
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
    throw new Error(
      `Epson token refresh failed (HTTP ${res.status}): ${JSON.stringify(data)}`
    );
  }

  // Epson rotates the refresh token on every refresh -- the new one must be
  // persisted, the old one will no longer work.
  return prisma.epsonConnection.update({
    where: { id: "singleton" },
    data: {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      accessTokenExpiresAt: new Date(Date.now() + data.expires_in * 1000),
    },
  });
}

/**
 * Returns a valid device access token, refreshing it first if it's expired
 * or close to it. Every printing API call should go through this rather than
 * reading EpsonConnection.accessToken directly.
 */
export async function getValidDeviceToken(): Promise<string> {
  const connection = await prisma.epsonConnection.findUnique({
    where: { id: "singleton" },
  });

  if (!connection) {
    throw new Error(
      "No Epson connection configured -- the one-time device authorization flow hasn't been completed yet."
    );
  }

  const expiresAt = connection.accessTokenExpiresAt.getTime();
  if (Date.now() < expiresAt - EXPIRY_SAFETY_MARGIN_MS) {
    return connection.accessToken;
  }

  const refreshed = await refreshDeviceToken(connection.refreshToken);
  return refreshed.accessToken;
}
