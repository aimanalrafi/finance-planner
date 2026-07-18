import { NextRequest, NextResponse } from "next/server";
import { badRequest, guard, num } from "@/lib/api";
import { getYearSummary } from "@/lib/logic";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ year: string }> }
) {
  const g = guard(req);
  if (g) return g;
  const { year } = await ctx.params;
  const y = num(year);
  if (y === null || y < 2000 || y > 2200) return badRequest("Invalid year");
  return NextResponse.json(getYearSummary(y));
}
