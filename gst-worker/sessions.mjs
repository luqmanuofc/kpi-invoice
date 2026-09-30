// In-memory session store -- one Node process, one Map, no Redis/DB. This
// is deliberately as simple as possible: expected usage is one person doing
// one lookup at a time, a handful of times ever per buyer, so there's no
// real concurrency or durability need. A restart of the worker process
// drops any in-flight session, which just means the person retries the
// (idempotent) lookup from scratch -- acceptable for how rarely this runs.

import { randomUUID } from "node:crypto";
import { openLookup, submitAnswer, closeLookup } from "./lookup.mjs";

const SESSION_TTL_MS = 5 * 60 * 1000; // idle timeout: nobody answered the captcha
const MAX_ATTEMPTS = 4;

const sessions = new Map(); // sessionId -> { browser, page, gstin, attempts, timer }

function scheduleExpiry(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return;
  clearTimeout(session.timer);
  session.timer = setTimeout(() => expireSession(sessionId), SESSION_TTL_MS);
  session.timer.unref?.();
}

async function expireSession(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return;
  sessions.delete(sessionId);
  await closeLookup(session.browser);
}

async function endSession(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return;
  clearTimeout(session.timer);
  sessions.delete(sessionId);
  await closeLookup(session.browser);
}

export async function startSession(gstin) {
  const { browser, page, captchaImage } = await openLookup(gstin);
  const sessionId = randomUUID();
  sessions.set(sessionId, { browser, page, gstin, attempts: 0, timer: null });
  scheduleExpiry(sessionId);
  return { sessionId, captchaImage };
}

export async function answerSession(sessionId, answer) {
  const session = sessions.get(sessionId);
  if (!session) return { status: "not_found" };

  session.attempts += 1;

  let result;
  try {
    result = await submitAnswer(session.page, answer);
  } catch (err) {
    // A page/selector hiccup (e.g. the refreshed captcha image not settling
    // in time) shouldn't leave the browser session orphaned or surface a
    // bare 500 -- clean up and give the caller something it can show.
    console.error(`answerSession(${sessionId}) failed:`, err);
    await endSession(sessionId);
    return { status: "error", message: err.message || "Something went wrong talking to the GST portal" };
  }

  if (result.ok) {
    await endSession(sessionId);
    return { status: "success", data: result.data };
  }

  if (session.attempts >= MAX_ATTEMPTS) {
    await endSession(sessionId);
    return { status: "failed" };
  }

  scheduleExpiry(sessionId);
  return { status: "wrong_captcha", captchaImage: result.captchaImage };
}

/** Closes every open session -- used on process shutdown so a SIGTERM
 * doesn't leave orphaned headless Chromium processes behind. */
export async function closeAllSessions() {
  const ids = [...sessions.keys()];
  await Promise.all(ids.map((id) => endSession(id)));
}
