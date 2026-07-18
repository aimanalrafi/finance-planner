import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/logic";
import { badRequest, guard, num, str } from "@/lib/api";

export async function GET(req: NextRequest) {
  const g = guard(req);
  if (g) return g;
  return NextResponse.json(getSettings());
}

const FRAMEWORKS: Record<string, [number, number, number] | null> = {
  "50/30/20": [50, 30, 20],
  "70/20/10": [70, 20, 10],
  zero: [50, 30, 20],
  pyf: [50, 30, 20],
  custom: null,
};

export async function PUT(req: NextRequest) {
  const g = guard(req);
  if (g) return g;
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return badRequest("Invalid JSON");
  }
  const d = db();

  const updates: string[] = [];
  const args: unknown[] = [];

  if (body.mode !== undefined) {
    if (body.mode !== "solo" && body.mode !== "household") return badRequest("Invalid mode");
    updates.push("mode = ?");
    args.push(body.mode);
  }
  if (body.framework !== undefined) {
    const fw = body.framework as string;
    if (!(fw in FRAMEWORKS)) return badRequest("Invalid framework");
    updates.push("framework = ?");
    args.push(fw);
    const preset = FRAMEWORKS[fw];
    if (preset) {
      updates.push("needs_pct = ?", "wants_pct = ?", "savings_pct = ?");
      args.push(...preset);
    }
  }
  for (const key of ["needs_pct", "wants_pct", "savings_pct", "surprise_alert_pct"] as const) {
    if (body[key] !== undefined) {
      const v = num(body[key]);
      if (v === null || v < 0 || v > 100) return badRequest(`Invalid ${key}`);
      updates.push(`${key} = ?`);
      args.push(v);
    }
  }
  if (body.onboarded !== undefined) {
    updates.push("onboarded = ?");
    args.push(body.onboarded ? 1 : 0);
  }

  if (updates.length > 0) {
    d.prepare(`UPDATE settings SET ${updates.join(", ")} WHERE id = 1`).run(...args);
  }

  if (Array.isArray(body.persons)) {
    const upsert = d.prepare(
      "INSERT INTO persons (id, name) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET name = excluded.name"
    );
    for (const p of body.persons as Record<string, unknown>[]) {
      const id = num(p.id);
      const name = str(p.name, 60);
      if (id === null || (id !== 1 && id !== 2) || !name) return badRequest("Invalid person");
      upsert.run(id, name);
    }
  }

  return NextResponse.json(getSettings());
}
