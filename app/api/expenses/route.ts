import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { badRequest, guard, money, num, ownerTag, str } from "@/lib/api";
import { isValidMonth } from "@/lib/months";

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
  if (amount === null) return badRequest("Invalid amount");

  const d = db();
  if (!d.prepare("SELECT 1 FROM categories WHERE id = ?").get(cid)) {
    return badRequest("Unknown category");
  }
  const spentOn = body.spent_on !== undefined ? str(body.spent_on, 10) : null;
  const note = body.note !== undefined ? str(body.note, 500) : null;
  const r = d
    .prepare(
      `INSERT INTO expenses (month, category_id, name, amount, spent_on, owner_tag, tentative, surprise, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      month,
      cid,
      name,
      amount,
      spentOn,
      ownerTag(body.owner_tag),
      body.tentative ? 1 : 0,
      body.surprise ? 1 : 0,
      note
    );
  return NextResponse.json({ id: r.lastInsertRowid });
}
