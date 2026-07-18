import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { badRequest, guard, money, num, ownerTag, str } from "@/lib/api";
import { isValidMonth } from "@/lib/months";
import { getInstalmentsRaw, instalmentForMonth } from "@/lib/logic";
import { currentMonth } from "@/lib/months";

export async function GET(req: NextRequest) {
  const g = guard(req);
  if (g) return g;
  const month = req.nextUrl.searchParams.get("month") || currentMonth();
  if (!isValidMonth(month)) return badRequest("Invalid month");
  return NextResponse.json(getInstalmentsRaw().map((r) => instalmentForMonth(r, month)));
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
  const total = money(body.total);
  const months = num(body.months);
  const start = body.start_month;
  if (!name) return badRequest("Name required");
  if (cid === null) return badRequest("Invalid category");
  if (total === null || total <= 0) return badRequest("Invalid total");
  if (months === null || !Number.isInteger(months) || months < 1 || months > 120) {
    return badRequest("Months must be 1-120");
  }
  if (!isValidMonth(start)) return badRequest("Invalid start month");

  const d = db();
  if (!d.prepare("SELECT 1 FROM categories WHERE id = ?").get(cid)) {
    return badRequest("Unknown category");
  }
  const icon = str(body.icon, 60) || "credit_card";
  const r = d
    .prepare(
      "INSERT INTO instalments (name, icon, category_id, total, months, start_month, owner_tag) VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    .run(name, icon, cid, total, months, start, ownerTag(body.owner_tag));
  return NextResponse.json({ id: r.lastInsertRowid });
}
