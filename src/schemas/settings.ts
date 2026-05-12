// Shared Zod schemas for Settings.
// Imported by both the frontend (src/api/settings.ts) and the Netlify backend
// (netlify/functions/*Settings.ts) so wire-format validation is identical on
// both sides.
import { z } from "zod";

export const BankAccountSchema = z.object({
  bank: z.string().min(1, "Bank name is required"),
  branch: z.string().min(1, "Branch is required"),
  accountNo: z.string().min(1, "Account number is required"),
  ifsc: z.string().min(1, "IFSC is required"),
  visible: z.boolean().default(true),
});

export const SettingsSchema = z.object({
  id: z.string(),
  bankAccounts: z.array(BankAccountSchema),
  updatedAt: z.string(),
});

export const SettingsUpdateSchema = z.object({
  bankAccounts: z.array(BankAccountSchema),
});

export type BankAccount = z.infer<typeof BankAccountSchema>;
export type Settings = z.infer<typeof SettingsSchema>;
export type SettingsUpdate = z.infer<typeof SettingsUpdateSchema>;
