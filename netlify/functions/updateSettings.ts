import { ZodError } from "zod";
import prisma from "../lib/prisma";
import { validateAuth, unauthorizedResponse } from "../lib/auth";
import { SettingsUpdateSchema } from "../../src/schemas/settings";

export default async function handler(request: Request) {
  if (!validateAuth(request)) {
    return unauthorizedResponse();
  }

  if (request.method !== "PUT") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await request.json();
    const { bankAccounts } = SettingsUpdateSchema.parse(body);

    const settings = await prisma.settings.upsert({
      where: { id: "singleton" },
      update: { bankAccounts },
      create: {
        id: "singleton",
        bankAccounts,
      },
    });

    return new Response(JSON.stringify(settings), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    if (err instanceof ZodError) {
      return new Response(
        JSON.stringify({ error: "Invalid payload", issues: err.issues }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
