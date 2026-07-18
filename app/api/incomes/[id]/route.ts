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
  const incomeId = num(id);
  if (incomeId === null) return badRequest("Invalid id");
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return badRequest("Invalid JSON");
  }
  const d = db();
  const row = d.prepare("SELECT * FROM income_sources WHERE id = ?").get(incomeId) as
    | Record<string, unknown>
    | undefined;
  if (!row) return badRequest("Not found");

  const name = body.name !== undefined ? str(body.name, 100) : (row.name as string);
  const amount = body.amount !== undefined ? money(body.amount) : (row.amount as number);
  if (!name) return badRequest("Invalid name");
  if (amount === null) return badRequest("Invalid amount");

  d.prepare("UPDATE income_sources SET name = ?, amount = ? WHERE id = ?").run(name, amount, incomeId);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const g = guard(req);
  if (g) return g;
  const { id } = await ctx.params;
  const incomeId = num(id);
  if (incomeId === null) return badRequest("Invalid id");
  db().prepare("DELETE FROM income_sources WHERE id = ?").run(incomeId);
  return NextResponse.json({ ok: true });
}
