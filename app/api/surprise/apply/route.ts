import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { badRequest, guard, money, num, ownerTag, str } from "@/lib/api";
import { isValidMonth } from "@/lib/months";
import { applyReallocation } from "@/lib/logic";

/**
 * Log the surprise expense and optionally apply the chosen reallocation moves:
 * { month, name, category_id, amount, owner_tag?, note?,
 *   moves: [{ from_category_id, amount }] }   — money moves INTO the surprise category's plan
 */
export async function POST(req: NextRequest) {
  const g = guard(req);
  if (g) return g;
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return badRequest("Invalid JSON");
  }
  const month = body.month;
  const cid = num(body.category_id);
  const name = str(body.name, 120);
  const amount = money(body.amount);
  if (!isValidMonth(month)) return badRequest("Invalid month");
  if (cid === null) return badRequest("Invalid category");
  if (!name) return badRequest("Name required");
  if (amount === null || amount <= 0) return badRequest("Invalid amount");

  const d = db();
  if (!d.prepare("SELECT 1 FROM categories WHERE id = ?").get(cid)) {
    return badRequest("Unknown category");
  }

  const moves: { from_category_id: number; to_category_id: number; amount: number }[] = [];
  if (Array.isArray(body.moves) && body.moves.length > 50) return badRequest("Too many moves");
  if (Array.isArray(body.moves)) {
    for (const m of body.moves as Record<string, unknown>[]) {
      const from = num(m.from_category_id);
      const amt = money(m.amount);
      if (from === null || amt === null || amt <= 0) return badRequest("Invalid move");
      if (!d.prepare("SELECT 1 FROM categories WHERE id = ?").get(from)) {
        return badRequest("Unknown move category");
      }
      moves.push({ from_category_id: from, to_category_id: cid, amount: amt });
    }
  }

  const note = body.note !== undefined ? str(body.note, 500) : null;
  const tx = d.transaction(() => {
    d.prepare(
      `INSERT INTO expenses (month, category_id, name, amount, owner_tag, tentative, surprise, note)
       VALUES (?, ?, ?, ?, ?, 0, 1, ?)`
    ).run(month, cid, name, amount, ownerTag(body.owner_tag), note);
    if (moves.length > 0) applyReallocation(month as string, moves);
  });
  tx();
  return NextResponse.json({ ok: true });
}
