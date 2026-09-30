import { apiClient } from "../utils/auth";

export interface GstLookupStartResult {
  sessionId: string;
  captchaImage: string; // base64 PNG
}

export type GstCaptchaResult =
  | { status: "success"; verification: unknown }
  | { status: "wrong_captcha"; captchaImage: string }
  | { status: "failed" }
  | { status: "not_found" }
  | { status: "incomplete"; error: string };

export async function startGstLookup(
  gstin: string
): Promise<GstLookupStartResult> {
  const response = await apiClient("/.netlify/functions/startGstLookup", {
    method: "POST",
    body: JSON.stringify({ gstin }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "GST lookup failed to start");
  }

  return response.json();
}

export async function submitGstCaptcha(params: {
  sessionId: string;
  answer: string;
  buyerId: string;
  gstin: string;
}): Promise<GstCaptchaResult> {
  const response = await apiClient("/.netlify/functions/submitGstCaptcha", {
    method: "POST",
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "GST lookup failed");
  }

  return response.json();
}
