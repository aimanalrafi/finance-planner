import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { badRequest, guard, money, num, ownerTag, str } from "@/lib/api";
import { isValidMonth } from "@/lib/months";

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const g = guard(req);
  if (g) return g;
  const { id } = await ctx.params;
  const expId = num(id);
  if (expId === null) return badRequest("Invalid id");
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return badRequest("Invalid JSON");
  }
  const d = db();
  const row = d.prepare("SELECT * FROM expenses WHERE id = ?").get(expId) as
    | Record<string, unknown>
    | undefined;
  if (!row) return badRequest("Not found");

  const updates: string[] = [];
  const args: unknown[] = [];
  if (body.name !== undefined) {
    const name = str(body.name, 120);
    if (!name) return badRequest("Invalid name");
    updates.push("name = ?");
    args.push(name);
  }
  if (body.amount !== undefined) {
    const amount = money(body.amount);
    if (amount === null) return badRequest("Invalid amount");
    updates.push("amount = ?");
    args.push(amount);
  }
  if (body.category_id !== undefined) {
    const cid = num(body.category_id);
    if (cid === null || !d.prepare("SELECT 1 FROM categories WHERE id = ?").get(cid)) {
      return badRequest("Unknown category");
    }
    updates.push("category_id = ?");
    args.push(cid);
  }
  if (body.month !== undefined) {
    if (!isValidMonth(body.month)) return badRequest("Invalid month");
    updates.push("month = ?");
    args.push(body.month);
  }
  if (body.tentative !== undefined) {
    updates.push("tentative = ?");
    args.push(body.tentative ? 1 : 0);
  }
  if (body.surprise !== undefined) {
    updates.push("surprise = ?");
    args.push(body.surprise ? 1 : 0);
  }
  if (body.owner_tag !== undefined) {
    updates.push("owner_tag = ?");
    args.push(ownerTag(body.owner_tag));
  }
  if (body.spent_on !== undefined) {
    updates.push("spent_on = ?");
    args.push(body.spent_on === null ? null : str(body.spent_on, 10));
  }
  if (body.note !== undefined) {
    updates.push("note = ?");
    args.push(body.note === null ? null : str(body.note, 500));
  }
  if (updates.length === 0) return NextResponse.json({ ok: true });
  args.push(expId);
  d.prepare(`UPDATE expenses SET ${updates.join(", ")} WHERE id = ?`).run(...args);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const g = guard(req);
  if (g) return g;
  const { id } = await ctx.params;
  const expId = num(id);
  if (expId === null) return badRequest("Invalid id");
  db().prepare("DELETE FROM expenses WHERE id = ?").run(expId);
  return NextResponse.json({ ok: true });
}
