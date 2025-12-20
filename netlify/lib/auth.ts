const AUTH_TOKEN = process.env.AUTH_TOKEN;

if (!AUTH_TOKEN) {
  throw new Error("AUTH_TOKEN environment variable is required but not set");
}

export function validateAuth(request: Request): boolean {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader) {
    return false;
  }

  const token = authHeader.replace("Bearer ", "");
  return token === AUTH_TOKEN;
}

export function unauthorizedResponse(): Response {
  return new Response("Unauthorized", { status: 401 });
}
