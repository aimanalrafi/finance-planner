import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCategories } from "@/lib/logic";
import { badRequest, guard, ownerTag, str } from "@/lib/api";

export async function GET(req: NextRequest) {
  const g = guard(req);
  if (g) return g;
  const includeArchived = req.nextUrl.searchParams.get("archived") === "1";
  return NextResponse.json(getCategories(includeArchived));
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
  const bucket = body.bucket;
  if (bucket !== "needs" && bucket !== "wants" && bucket !== "savings") {
    return badRequest("Invalid bucket");
  }
  const name = str(body.name, 80);
  if (!name) return badRequest("Name required");
  const icon = str(body.icon, 60) || "category";
  const invest = body.invest_type !== undefined ? str(body.invest_type, 60) : null;

  const d = db();
  const max = d
    .prepare("SELECT COALESCE(MAX(sort), -1) AS m FROM categories WHERE bucket = ?")
    .get(bucket) as { m: number };
  const r = d
    .prepare(
      "INSERT INTO categories (bucket, name, icon, owner_tag, is_buffer, invest_type, sort, auto_paid) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .run(
      bucket,
      name,
      icon,
      ownerTag(body.owner_tag),
      body.is_buffer ? 1 : 0,
      invest,
      max.m + 1,
      body.auto_paid ? 1 : 0
    );
  return NextResponse.json({ id: r.lastInsertRowid });
}
