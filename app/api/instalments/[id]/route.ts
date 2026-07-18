import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { badRequest, guard, money, num, str } from "@/lib/api";
import { isValidMonth } from "@/lib/months";

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const g = guard(req);
  if (g) return g;
  const { id } = await ctx.params;
  const instId = num(id);
  if (instId === null) return badRequest("Invalid id");
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return badRequest("Invalid JSON");
  }
  const d = db();
  const row = d.prepare("SELECT * FROM instalments WHERE id = ?").get(instId) as
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
  if (body.icon !== undefined) {
    const icon = str(body.icon, 60);
    if (!icon) return badRequest("Invalid icon");
    updates.push("icon = ?");
    args.push(icon);
  }
  if (body.total !== undefined) {
    const total = money(body.total);
    if (total === null || total <= 0) return badRequest("Invalid total");
    updates.push("total = ?");
    args.push(total);
  }
  if (body.months !== undefined) {
    const months = num(body.months);
    if (months === null || !Number.isInteger(months) || months < 1 || months > 120) {
      return badRequest("Months must be 1-120");
    }
    updates.push("months = ?");
    args.push(months);
  }
  if (body.start_month !== undefined) {
    if (!isValidMonth(body.start_month)) return badRequest("Invalid start month");
    updates.push("start_month = ?");
    args.push(body.start_month);
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
  args.push(instId);
  d.prepare(`UPDATE instalments SET ${updates.join(", ")} WHERE id = ?`).run(...args);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const g = guard(req);
  if (g) return g;
  const { id } = await ctx.params;
  const instId = num(id);
  if (instId === null) return badRequest("Invalid id");
  db().prepare("DELETE FROM instalments WHERE id = ?").run(instId);
  return NextResponse.json({ ok: true });
}
