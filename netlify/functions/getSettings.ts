import prisma from "../lib/prisma";
import { validateAuth, unauthorizedResponse } from "../lib/auth";
import {
  BankAccountSchema,
  type BankAccount,
} from "../../src/schemas/settings";

const DEFAULT_BANKS: BankAccount[] = [
  {
    bank: "JK Bank",
    branch: "Zainakot",
    accountNo: "0258020100000059",
    ifsc: "JAKA0ZANKOT",
    visible: true,
  },
  {
    bank: "HDFC Bank",
    branch: "Malru",
    accountNo: "50200098216650",
    ifsc: "HDFC0003580",
    visible: true,
  },
];

export default async function handler(request: Request) {
  if (!validateAuth(request)) {
    return unauthorizedResponse();
  }

  if (request.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const settings = await prisma.settings.upsert({
      where: { id: "singleton" },
      update: {},
      create: {
        id: "singleton",
        bankAccounts: DEFAULT_BANKS,
      },
    });

    // Validate JSON-stored banks; drop any malformed entries before returning.
    const rawBanks = Array.isArray(settings.bankAccounts)
      ? settings.bankAccounts
      : [];
    const validBanks = rawBanks
      .map((b) => BankAccountSchema.safeParse(b))
      .filter((r) => r.success)
      .map((r) => r.data!);

    return new Response(
      JSON.stringify({ ...settings, bankAccounts: validBanks }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
