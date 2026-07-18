import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, verifySessionToken } from "./session";

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function badRequest(msg: string) {
  return NextResponse.json({ error: msg }, { status: 400 });
}

export function isAuthed(req: NextRequest): boolean {
  return verifySessionToken(req.cookies.get(COOKIE_NAME)?.value);
}

/** Defense in depth: every API route re-checks the session even though proxy.ts guards it. */
export function guard(req: NextRequest): NextResponse | null {
  if (!isAuthed(req)) return unauthorized();
  return null;
}

export function num(v: unknown): number | null {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : null;
}

export function money(v: unknown): number | null {
  const n = num(v);
  if (n === null || n < 0 || n > 100_000_000) return null;
  return Math.round(n * 100) / 100;
}

export function str(v: unknown, maxLen = 200): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (!t || t.length > maxLen) return null;
  return t;
}

export function ownerTag(v: unknown): "p1" | "p2" | "joint" | null {
  return v === "p1" || v === "p2" || v === "joint" ? v : null;
}

export const MAX_BULK_ITEMS = 500;
