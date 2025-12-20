import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required but not set");
}

export function validateAuth(request: Request): boolean {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    // Verify and decode the JWT token
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch (error) {
    // Token is invalid or expired
    return false;
  }
}

export function unauthorizedResponse(): Response {
  return new Response("Unauthorized", { status: 401 });
}
