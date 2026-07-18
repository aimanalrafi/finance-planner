import { NextRequest, NextResponse } from "next/server";
import { checkCredentials, clearAttempts, rateLimitCheck, recordFailedAttempt } from "@/lib/auth";
import { createSessionToken, COOKIE_NAME, sessionCookieOptions } from "@/lib/session";
import { badRequest, str } from "@/lib/api";

const MAX_BODY_BYTES = 16 * 1024;

export async function POST(req: NextRequest) {
  const rl = rateLimitCheck();
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${Math.ceil(rl.retryAfterSec / 60)} min.` },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    const raw = await req.text();
    if (raw.length > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }
    body = JSON.parse(raw);
  } catch {
    return badRequest("Invalid JSON");
  }
  const { email, password } = (body ?? {}) as Record<string, unknown>;
  const e = str(email, 200);
  const p = typeof password === "string" ? password : null;
  if (!e || !p) return badRequest("Email and password required");

  if (!checkCredentials(e, p)) {
    recordFailedAttempt();
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  clearAttempts();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, createSessionToken(), sessionCookieOptions());
  return res;
}
