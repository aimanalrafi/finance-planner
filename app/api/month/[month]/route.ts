import { NextRequest, NextResponse } from "next/server";
import { badRequest, guard } from "@/lib/api";
import { isValidMonth } from "@/lib/months";
import { getMonthBundle } from "@/lib/logic";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ month: string }> }
) {
  const g = guard(req);
  if (g) return g;
  const { month } = await ctx.params;
  if (!isValidMonth(month)) return badRequest("Invalid month");
  return NextResponse.json(getMonthBundle(month));
}
