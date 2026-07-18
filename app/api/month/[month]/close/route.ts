import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { badRequest, guard, money, num, MAX_BULK_ITEMS } from "@/lib/api";
import { addMonths, isValidMonth } from "@/lib/months";
import { getUnspent } from "@/lib/logic";

/** GET: unspent budget per category for the month (close-out helper). */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ month: string }> }
) {
  const g = guard(req);
  if (g) return g;
  const { month } = await ctx.params;
  if (!isValidMonth(month)) return badRequest("Invalid month");
  const closed = !!db().prepare("SELECT 1 FROM month_closes WHERE month = ?").get(month);
  return NextResponse.json({ month, closed, unspent: getUnspent(month) });
}

/**
 * POST: close the month applying per-category decisions:
 * { actions: [{ category_id, action: 'rollover' | 'save' | 'ignore', amount, save_category_id? }] }
 * - rollover: add amount to next month's plan for the same category
 * - save: log the amount as an actual contribution into a savings category
 * - ignore: do nothing
 */
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ month: string }> }
) {
  const g = guard(req);
  if (g) return g;
  const { month } = await ctx.params;
  if (!isValidMonth(month)) return badRequest("Invalid month");
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return badRequest("Invalid JSON");
  }

  const d = db();
  if (d.prepare("SELECT 1 FROM month_closes WHERE month = ?").get(month)) {
    return badRequest("Month is already closed");
  }
  const actions = Array.isArray(body.actions) ? (body.actions as Record<string, unknown>[]) : [];
  if (actions.length > MAX_BULK_ITEMS) return badRequest("Too many actions");
  const unspentByCat = new Map(getUnspent(month).map((u) => [u.category_id, u.unspent]));
  const next = addMonths(month, 1);
  const getPlan = d.prepare("SELECT planned FROM plans WHERE month = ? AND category_id = ?");
  const upPlan = d.prepare(
    `INSERT INTO plans (month, category_id, planned) VALUES (?, ?, ?)
     ON CONFLICT(month, category_id) DO UPDATE SET planned = excluded.planned`
  );
  const catName = d.prepare("SELECT name FROM categories WHERE id = ?");
  const savingsFallback = d
    .prepare("SELECT id FROM categories WHERE bucket = 'savings' AND archived = 0 ORDER BY is_buffer, sort LIMIT 1")
    .get() as { id: number } | undefined;

  const validated: { cid: number; action: string; amount: number; saveTo: number | null }[] = [];
  for (const a of actions) {
    const cid = num(a.category_id);
    const requested = money(a.amount);
    const action = a.action;
    if (cid === null || requested === null || requested <= 0) return badRequest("Invalid action item");
    if (action !== "rollover" && action !== "save" && action !== "ignore") {
      return badRequest("Invalid action");
    }
    if (!catName.get(cid)) return badRequest("Unknown category");
    // never trust the client's number — cap at the server-computed unspent budget
    const amount = Math.min(requested, unspentByCat.get(cid) ?? 0);
    if (amount <= 0) continue;
    let saveTo: number | null = null;
    if (action === "save") {
      const sc = a.save_category_id !== undefined ? num(a.save_category_id) : null;
      saveTo = sc ?? savingsFallback?.id ?? null;
      if (saveTo === null || !catName.get(saveTo)) return badRequest("No savings category available");
    }
    validated.push({ cid, action: action as string, amount, saveTo });
  }

  // record what was applied so reopening the month can reverse it exactly
  const applied: {
    cid: number;
    action: string;
    amount: number;
    saveTo?: number;
    expenseId?: number;
  }[] = [];
  const tx = d.transaction(() => {
    for (const v of validated) {
      if (v.action === "rollover") {
        const cur = (getPlan.get(next, v.cid) as { planned: number } | undefined)?.planned || 0;
        upPlan.run(next, v.cid, Math.round((cur + v.amount) * 100) / 100);
        applied.push({ cid: v.cid, action: "rollover", amount: v.amount });
      } else if (v.action === "save" && v.saveTo !== null) {
        const from = (catName.get(v.cid) as { name: string }).name;
        const r = d
          .prepare(
            `INSERT INTO expenses (month, category_id, name, amount, tentative, surprise, note)
             VALUES (?, ?, ?, ?, 0, 0, ?)`
          )
          .run(month, v.saveTo, `Unspent from ${from}`, v.amount, "Auto: month close");
        applied.push({
          cid: v.cid,
          action: "save",
          amount: v.amount,
          saveTo: v.saveTo,
          expenseId: Number(r.lastInsertRowid),
        });
      }
    }
    d.prepare("INSERT INTO month_closes (month, actions_json) VALUES (?, ?)").run(
      month,
      JSON.stringify(applied)
    );
  });
  tx();
  return NextResponse.json({ ok: true, closed: true });
}

/** DELETE: reopen a closed month, reversing the close-out side effects. */
export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ month: string }> }
) {
  const g = guard(req);
  if (g) return g;
  const { month } = await ctx.params;
  if (!isValidMonth(month)) return badRequest("Invalid month");
  const d = db();
  const row = d
    .prepare("SELECT actions_json FROM month_closes WHERE month = ?")
    .get(month) as { actions_json: string } | undefined;
  if (!row) return NextResponse.json({ ok: true, closed: false });

  let applied: { cid: number; action: string; amount: number; expenseId?: number }[] = [];
  try {
    applied = JSON.parse(row.actions_json);
  } catch {
    applied = [];
  }
  const next = addMonths(month, 1);
  const getPlan = d.prepare("SELECT planned FROM plans WHERE month = ? AND category_id = ?");
  const upPlan = d.prepare(
    `INSERT INTO plans (month, category_id, planned) VALUES (?, ?, ?)
     ON CONFLICT(month, category_id) DO UPDATE SET planned = excluded.planned`
  );
  const tx = d.transaction(() => {
    for (const a of applied) {
      if (a.action === "rollover") {
        const cur = (getPlan.get(next, a.cid) as { planned: number } | undefined)?.planned || 0;
        upPlan.run(next, a.cid, Math.max(0, Math.round((cur - a.amount) * 100) / 100));
      } else if (a.action === "save" && a.expenseId) {
        d.prepare("DELETE FROM expenses WHERE id = ?").run(a.expenseId);
      }
    }
    d.prepare("DELETE FROM month_closes WHERE month = ?").run(month);
  });
  tx();
  return NextResponse.json({ ok: true, closed: false });
}
