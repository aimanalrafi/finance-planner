import { timingSafeEqual, createHash } from "crypto";
import { db } from "./db";

const WINDOW_SECONDS = 15 * 60;
const MAX_ATTEMPTS = 15;

/**
 * The app is exposed directly (no reverse proxy), so client-IP headers are
 * attacker-controlled. Rate limiting is therefore GLOBAL: this is a
 * single-account app, so capping total failed attempts blocks online
 * brute-force outright (worst case an attacker can lock the login window,
 * which is preferable to unlimited guessing).
 */
const GLOBAL_KEY = "global";

function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function checkCredentials(email: string, password: string): boolean {
  const expectedEmail = process.env.APP_EMAIL;
  const expectedPassword = process.env.APP_PASSWORD;
  if (!expectedEmail || !expectedPassword) return false;
  const okEmail = safeEqual(email.trim().toLowerCase(), expectedEmail.trim().toLowerCase());
  const okPass = safeEqual(password, expectedPassword);
  return okEmail && okPass;
}

export function rateLimitCheck(): { allowed: boolean; retryAfterSec: number } {
  const d = db();
  const now = Math.floor(Date.now() / 1000);
  d.prepare("DELETE FROM login_attempts WHERE attempted_at < ?").run(now - WINDOW_SECONDS);
  const row = d
    .prepare("SELECT COUNT(*) AS c, MIN(attempted_at) AS oldest FROM login_attempts WHERE ip = ?")
    .get(GLOBAL_KEY) as { c: number; oldest: number | null };
  if (row.c >= MAX_ATTEMPTS) {
    const retry = (row.oldest || now) + WINDOW_SECONDS - now;
    return { allowed: false, retryAfterSec: Math.max(retry, 1) };
  }
  return { allowed: true, retryAfterSec: 0 };
}

export function recordFailedAttempt() {
  db()
    .prepare("INSERT INTO login_attempts (ip, attempted_at) VALUES (?, ?)")
    .run(GLOBAL_KEY, Math.floor(Date.now() / 1000));
}

export function clearAttempts() {
  db().prepare("DELETE FROM login_attempts WHERE ip = ?").run(GLOBAL_KEY);
}
