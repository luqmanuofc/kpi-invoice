import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";

/** Pause the script and ask the human to type something (used for the OTP). */
export async function promptInput(question) {
  const rl = readline.createInterface({ input: stdin, output: stdout });
  try {
    return (await rl.question(question)).trim();
  } finally {
    rl.close();
  }
}
