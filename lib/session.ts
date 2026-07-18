import { createHmac, timingSafeEqual } from "crypto";

const SESSION_DAYS = 30;
export const COOKIE_NAME = "fp_session";

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error("SESSION_SECRET env var (>=16 chars) is required");
  }
  return s;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createSessionToken(): string {
  const exp = Date.now() + SESSION_DAYS * 24 * 3600 * 1000;
  const payload = `v1.${exp}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const idx = token.lastIndexOf(".");
  if (idx <= 0) return false;
  const payload = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  const parts = payload.split(".");
  if (parts[0] !== "v1") return false;
  const exp = Number(parts[1]);
  return Number.isFinite(exp) && Date.now() < exp;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: false, // served over plain HTTP on the raw IP; flip to true behind TLS
    path: "/",
    maxAge: SESSION_DAYS * 24 * 3600,
  };
}
