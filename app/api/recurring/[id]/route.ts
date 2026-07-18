import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { badRequest, guard, money, num, str } from "@/lib/api";

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const g = guard(req);
  if (g) return g;
  const { id } = await ctx.params;
  const recId = num(id);
  if (recId === null) return badRequest("Invalid id");
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return badRequest("Invalid JSON");
  }
  const d = db();
  const row = d.prepare("SELECT * FROM recurring WHERE id = ?").get(recId) as
    | Record<string, unknown>
    | undefined;
  if (!row) return badRequest("Not found");

  const updates: string[] = [];
  const args: unknown[] = [];
  if (body.name !== undefined) {
    const name = str(body.name, 100);
    if (!name) return badRequest("Invalid name");
    updates.push("name = ?");
    args.push(name);
  }
  if (body.amount !== undefined) {
    const amount = money(body.amount);
    if (amount === null || amount <= 0) return badRequest("Invalid amount");
    updates.push("amount = ?");
    args.push(amount);
  }
  if (body.due_months !== undefined) {
    if (
      !Array.isArray(body.due_months) ||
      body.due_months.length === 0 ||
      (body.due_months as unknown[]).some(
        (m) => typeof m !== "number" || !Number.isInteger(m) || m < 1 || m > 12
      )
    ) {
      return badRequest("Invalid due months");
    }
    updates.push("due_months = ?");
    args.push(JSON.stringify([...new Set(body.due_months as number[])].sort((a, b) => a - b)));
  }
  if (body.schedule !== undefined) {
    if (!["annual", "quarterly", "semester", "custom"].includes(body.schedule as string)) {
      return badRequest("Invalid schedule");
    }
    updates.push("schedule = ?");
    args.push(body.schedule);
  }
  if (body.category_id !== undefined) {
    const cid = num(body.category_id);
    if (cid === null || !d.prepare("SELECT 1 FROM categories WHERE id = ?").get(cid)) {
      return badRequest("Unknown category");
    }
    updates.push("category_id = ?");
    args.push(cid);
  }
  if (updates.length === 0) return NextResponse.json({ ok: true });
  args.push(recId);
  d.prepare(`UPDATE recurring SET ${updates.join(", ")} WHERE id = ?`).run(...args);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const g = guard(req);
  if (g) return g;
  const { id } = await ctx.params;
  const recId = num(id);
  if (recId === null) return badRequest("Invalid id");
  db().prepare("DELETE FROM recurring WHERE id = ?").run(recId);
  return NextResponse.json({ ok: true });
}
