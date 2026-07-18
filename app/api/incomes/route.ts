import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { badRequest, guard, money, num, str } from "@/lib/api";
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
  const personId = num(body.person_id);
  const name = str(body.name, 100);
  const amount = money(body.amount);
  if (!isValidMonth(month)) return badRequest("Invalid month");
  if (personId === null || (personId !== 1 && personId !== 2)) return badRequest("Invalid person");
  if (!name) return badRequest("Name required");
  if (amount === null) return badRequest("Invalid amount");

  const d = db();
  const exists = d.prepare("SELECT 1 FROM persons WHERE id = ?").get(personId);
  if (!exists) {
    d.prepare("INSERT INTO persons (id, name) VALUES (?, ?)").run(personId, `Person ${personId}`);
  }
  const r = d
    .prepare("INSERT INTO income_sources (month, person_id, name, amount) VALUES (?, ?, ?, ?)")
    .run(month, personId, name, amount);
  return NextResponse.json({ id: r.lastInsertRowid });
}
