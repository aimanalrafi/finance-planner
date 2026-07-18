import { NextRequest, NextResponse } from "next/server";
import { badRequest, guard, money, num } from "@/lib/api";
import { isValidMonth } from "@/lib/months";
import { surprisePreview } from "@/lib/logic";

/** Preview a surprise expense's impact and get reallocation suggestions. Does not persist. */
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
  const cid = num(body.category_id);
  const amount = money(body.amount);
  if (!isValidMonth(month)) return badRequest("Invalid month");
  if (cid === null) return badRequest("Invalid category");
  if (amount === null || amount <= 0) return badRequest("Invalid amount");
  try {
    return NextResponse.json(surprisePreview(month, cid, amount));
  } catch (e) {
    return badRequest(e instanceof Error ? e.message : "Preview failed");
  }
}
