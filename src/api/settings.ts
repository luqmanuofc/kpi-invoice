import { apiClient } from "../utils/auth";
import {
  SettingsSchema,
  SettingsUpdateSchema,
  type Settings,
  type SettingsUpdate,
} from "../schemas/settings";

export {
  BankAccountSchema,
  SettingsSchema,
  SettingsUpdateSchema,
} from "../schemas/settings";
export type { BankAccount, Settings, SettingsUpdate } from "../schemas/settings";

export async function getSettings(): Promise<Settings> {
  const response = await apiClient("/.netlify/functions/getSettings", {
    method: "GET",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Get settings failed: ${text}`);
  }

  const json = await response.json();
  return SettingsSchema.parse(json);
}

export async function updateSettings(data: SettingsUpdate): Promise<Settings> {
  const parsed = SettingsUpdateSchema.parse(data);

  const response = await apiClient("/.netlify/functions/updateSettings", {
    method: "PUT",
    body: JSON.stringify(parsed),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Update settings failed: ${text}`);
  }

  const json = await response.json();
  return SettingsSchema.parse(json);
}
