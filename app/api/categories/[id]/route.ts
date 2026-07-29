import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { badRequest, guard, num, ownerTag, str } from "@/lib/api";

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const g = guard(req);
  if (g) return g;
  const { id } = await ctx.params;
  const catId = num(id);
  if (catId === null) return badRequest("Invalid id");
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return badRequest("Invalid JSON");
  }
  const d = db();
  const row = d.prepare("SELECT * FROM categories WHERE id = ?").get(catId) as
    | Record<string, unknown>
    | undefined;
  if (!row) return badRequest("Not found");

  const updates: string[] = [];
  const args: unknown[] = [];
  if (body.name !== undefined) {
    const name = str(body.name, 80);
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
  if (body.bucket !== undefined) {
    if (body.bucket !== "needs" && body.bucket !== "wants" && body.bucket !== "savings") {
      return badRequest("Invalid bucket");
    }
    updates.push("bucket = ?");
    args.push(body.bucket);
  }
  if (body.owner_tag !== undefined) {
    updates.push("owner_tag = ?");
    args.push(ownerTag(body.owner_tag));
  }
  if (body.invest_type !== undefined) {
    updates.push("invest_type = ?");
    args.push(body.invest_type === null ? null : str(body.invest_type, 60));
  }
  if (body.archived !== undefined) {
    updates.push("archived = ?");
    args.push(body.archived ? 1 : 0);
  }
  if (body.auto_paid !== undefined) {
    updates.push("auto_paid = ?");
    args.push(body.auto_paid ? 1 : 0);
  }
  if (updates.length === 0) return NextResponse.json({ ok: true });
  args.push(catId);
  d.prepare(`UPDATE categories SET ${updates.join(", ")} WHERE id = ?`).run(...args);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const g = guard(req);
  if (g) return g;
  const { id } = await ctx.params;
  const catId = num(id);
  if (catId === null) return badRequest("Invalid id");
  const d = db();
  const used = d
    .prepare(
      `SELECT (SELECT COUNT(*) FROM expenses WHERE category_id = @id)
             + (SELECT COUNT(*) FROM plans WHERE category_id = @id AND planned != 0)
             + (SELECT COUNT(*) FROM instalments WHERE category_id = @id)
             + (SELECT COUNT(*) FROM recurring WHERE category_id = @id) AS c`
    )
    .get({ id: catId }) as { c: number };
  if (used.c > 0) {
    // keep history intact — archive instead of destroying data
    d.prepare("UPDATE categories SET archived = 1 WHERE id = ?").run(catId);
    return NextResponse.json({ ok: true, archived: true });
  }
  d.prepare("DELETE FROM categories WHERE id = ?").run(catId);
  return NextResponse.json({ ok: true, deleted: true });
}
