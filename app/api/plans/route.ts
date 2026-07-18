import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { badRequest, guard, money, num, MAX_BULK_ITEMS } from "@/lib/api";
import { isValidMonth } from "@/lib/months";
import { copyPlanFromMonth } from "@/lib/logic";

/** Bulk-set planned amounts: { month, items: [{category_id, planned}] } */
export async function PUT(req: NextRequest) {
  const g = guard(req);
  if (g) return g;
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return badRequest("Invalid JSON");
  }
  const month = body.month;
  if (!isValidMonth(month)) return badRequest("Invalid month");
  if (!Array.isArray(body.items) || body.items.length > MAX_BULK_ITEMS) {
    return badRequest("items array required (max 500)");
  }

  const d = db();
  const catExists = d.prepare("SELECT 1 FROM categories WHERE id = ?");
  const up = d.prepare(
    `INSERT INTO plans (month, category_id, planned) VALUES (?, ?, ?)
     ON CONFLICT(month, category_id) DO UPDATE SET planned = excluded.planned`
  );

  const items: { category_id: number; planned: number }[] = [];
  for (const it of body.items as Record<string, unknown>[]) {
    const cid = num(it.category_id);
    const planned = money(it.planned);
    if (cid === null || planned === null) return badRequest("Invalid item");
    if (!catExists.get(cid)) return badRequest(`Unknown category ${cid}`);
    items.push({ category_id: cid, planned });
  }
  const tx = d.transaction(() => {
    for (const it of items) up.run(month, it.category_id, it.planned);
  });
  tx();
  return NextResponse.json({ ok: true, count: items.length });
}

/** Copy plan (and incomes if empty) from another month: { from, to } */
export async function POST(req: NextRequest) {
  const g = guard(req);
  if (g) return g;
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return badRequest("Invalid JSON");
  }
  const { from, to } = body;
  if (!isValidMonth(from) || !isValidMonth(to) || from === to) {
    return badRequest("Invalid from/to months");
  }
  const count = copyPlanFromMonth(from, to);
  return NextResponse.json({ ok: true, copied: count });
}
