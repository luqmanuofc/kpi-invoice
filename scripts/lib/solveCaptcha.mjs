import Anthropic from "@anthropic-ai/sdk";

// Shared by scripts/eway-poc and scripts/gstin-lookup.
//
// Cheap/fast is fine here -- this is reading ~5-6 distorted characters from a
// small image, not a task that benefits from Opus-level reasoning. Swap back
// to "claude-opus-5" if accuracy on your specific captcha style is poor.
const MODEL_ID = process.env.CAPTCHA_SOLVE_MODEL || "claude-haiku-4-5-20251001";

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env

/**
 * @param {Buffer} pngBuffer - screenshot of just the captcha <img> element
 * @returns {Promise<string>} the model's best guess at the captcha text
 */
export async function solveCaptcha(pngBuffer) {
  const response = await client.messages.create({
    model: MODEL_ID,
    max_tokens: 32,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/png",
              data: pngBuffer.toString("base64"),
            },
          },
          {
            type: "text",
            text:
              "This is a distorted-text CAPTCHA image from a login form. " +
              "Reply with ONLY the characters shown -- no punctuation, no " +
              "explanation, no extra words. If you can't read it confidently, " +
              "reply with exactly: UNSURE",
          },
        ],
      },
    ],
  });

  const text = response.content.find((b) => b.type === "text")?.text ?? "";
  return text.trim();
}
