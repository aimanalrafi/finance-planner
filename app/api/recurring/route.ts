import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { badRequest, guard, money, num, ownerTag, str } from "@/lib/api";
import { getRecurring } from "@/lib/logic";

const SCHEDULES = ["annual", "quarterly", "semester", "custom"];

function parseDueMonths(v: unknown): number[] | null {
  if (!Array.isArray(v) || v.length === 0 || v.length > 12) return null;
  const months = v.map((x) => num(x));
  if (months.some((m) => m === null || !Number.isInteger(m) || m < 1 || m > 12)) return null;
  return [...new Set(months as number[])].sort((a, b) => a - b);
}

export async function GET(req: NextRequest) {
  const g = guard(req);
  if (g) return g;
  return NextResponse.json(getRecurring());
}

export async function POST(req: NextRequest) {
  const g = guard(req);
  if (g) return g;
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return badRequest("Invalid JSON");
  }
  const name = str(body.name, 100);
  const cid = num(body.category_id);
  const amount = money(body.amount);
  const schedule = body.schedule;
  const due = parseDueMonths(body.due_months);
  if (!name) return badRequest("Name required");
  if (cid === null) return badRequest("Invalid category");
  if (amount === null || amount <= 0) return badRequest("Invalid amount");
  if (typeof schedule !== "string" || !SCHEDULES.includes(schedule)) {
    return badRequest("Invalid schedule");
  }
  if (!due) return badRequest("Invalid due months");

  const d = db();
  if (!d.prepare("SELECT 1 FROM categories WHERE id = ?").get(cid)) {
    return badRequest("Unknown category");
  }
  const icon = str(body.icon, 60) || "event_repeat";
  const r = d
    .prepare(
      "INSERT INTO recurring (name, icon, category_id, amount, schedule, due_months, owner_tag) VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    .run(name, icon, cid, amount, schedule, JSON.stringify(due), ownerTag(body.owner_tag));
  return NextResponse.json({ id: r.lastInsertRowid });
}
