import { db } from "./db";
import { addMonths, monthDiff, monthNumber } from "./months";
import type {
  Bucket,
  BucketSummary,
  Category,
  CategoryMonth,
  Expense,
  IncomeSource,
  Instalment,
  MonthBundle,
  Recurring,
  Settings,
  SurprisePreview,
  SurpriseSuggestion,
  YearMonthSummary,
} from "./types";

const BUCKETS: Bucket[] = ["needs", "wants", "savings"];

export function getSettings(): Settings {
  const d = db();
  const s = d.prepare("SELECT * FROM settings WHERE id = 1").get() as Record<string, unknown>;
  const persons = d.prepare("SELECT id, name FROM persons ORDER BY id").all() as {
    id: number;
    name: string;
  }[];
  return {
    mode: s.mode as Settings["mode"],
    framework: s.framework as Settings["framework"],
    needs_pct: s.needs_pct as number,
    wants_pct: s.wants_pct as number,
    savings_pct: s.savings_pct as number,
    onboarded: !!s.onboarded,
    surprise_alert_pct: s.surprise_alert_pct as number,
    persons,
  };
}

function rowToCategory(r: Record<string, unknown>): Category {
  return {
    id: r.id as number,
    bucket: r.bucket as Bucket,
    name: r.name as string,
    icon: r.icon as string,
    owner_tag: (r.owner_tag ?? null) as Category["owner_tag"],
    is_buffer: !!r.is_buffer,
    invest_type: (r.invest_type ?? null) as string | null,
    archived: !!r.archived,
    sort: r.sort as number,
  };
}

export function getCategories(includeArchived = false): Category[] {
  const d = db();
  const rows = d
    .prepare(
      `SELECT * FROM categories ${includeArchived ? "" : "WHERE archived = 0"} ORDER BY bucket, sort, id`
    )
    .all() as Record<string, unknown>[];
  return rows.map(rowToCategory);
}

function rowToExpense(r: Record<string, unknown>): Expense {
  return {
    id: r.id as number,
    month: r.month as string,
    category_id: r.category_id as number,
    name: r.name as string,
    amount: r.amount as number,
    spent_on: (r.spent_on ?? null) as string | null,
    owner_tag: (r.owner_tag ?? null) as Expense["owner_tag"],
    tentative: !!r.tentative,
    surprise: !!r.surprise,
    note: (r.note ?? null) as string | null,
    created_at: r.created_at as string,
  };
}

export function instalmentForMonth(
  r: Record<string, unknown>,
  month: string
): Instalment {
  const start = r.start_month as string;
  const months = r.months as number;
  const total = r.total as number;
  const end = addMonths(start, months - 1);
  const idx = monthDiff(start, month); // 0-based position of viewed month in the schedule
  const active = idx >= 0 && idx < months;
  // equal cent-rounded portions, with the final month absorbing the rounding remainder
  const baseCents = Math.round((total * 100) / months);
  const monthlyCents =
    idx === months - 1 ? Math.round(total * 100) - baseCents * (months - 1) : baseCents;
  return {
    id: r.id as number,
    name: r.name as string,
    icon: r.icon as string,
    category_id: r.category_id as number,
    total: r.total as number,
    months,
    start_month: start,
    owner_tag: (r.owner_tag ?? null) as Instalment["owner_tag"],
    monthly: monthlyCents / 100,
    paid_count: Math.min(Math.max(idx + 1, 0), months),
    active,
    end_month: end,
  };
}

function rowToRecurring(r: Record<string, unknown>): Recurring {
  return {
    id: r.id as number,
    name: r.name as string,
    icon: r.icon as string,
    category_id: r.category_id as number,
    amount: r.amount as number,
    schedule: r.schedule as Recurring["schedule"],
    due_months: JSON.parse(r.due_months as string) as number[],
    owner_tag: (r.owner_tag ?? null) as Recurring["owner_tag"],
  };
}

export function getRecurring(): Recurring[] {
  const rows = db().prepare("SELECT * FROM recurring ORDER BY id").all() as Record<
    string,
    unknown
  >[];
  return rows.map(rowToRecurring);
}

export function getInstalmentsRaw(): Record<string, unknown>[] {
  return db().prepare("SELECT * FROM instalments ORDER BY id").all() as Record<
    string,
    unknown
  >[];
}

export function getMonthBundle(month: string): MonthBundle {
  const d = db();
  const settings = getSettings();
  const categories = getCategories();

  const incomes = (
    d.prepare("SELECT * FROM income_sources WHERE month = ? ORDER BY person_id, id").all(month) as Record<string, unknown>[]
  ).map((r) => ({
    id: r.id as number,
    month: r.month as string,
    person_id: r.person_id as number,
    name: r.name as string,
    amount: r.amount as number,
  })) as IncomeSource[];

  const total_income = incomes.reduce((s, i) => s + i.amount, 0);
  const income_by_person: Record<number, number> = {};
  for (const i of incomes) {
    income_by_person[i.person_id] = (income_by_person[i.person_id] || 0) + i.amount;
  }

  const planRows = d
    .prepare("SELECT category_id, planned FROM plans WHERE month = ?")
    .all(month) as { category_id: number; planned: number }[];
  const planned = new Map(planRows.map((p) => [p.category_id, p.planned]));

  const expenses = (
    d.prepare("SELECT * FROM expenses WHERE month = ? ORDER BY created_at DESC, id DESC").all(month) as Record<string, unknown>[]
  ).map(rowToExpense);

  const actualByCat = new Map<number, number>();
  const tentByCat = new Map<number, number>();
  for (const e of expenses) {
    const m = e.tentative ? tentByCat : actualByCat;
    m.set(e.category_id, (m.get(e.category_id) || 0) + e.amount);
  }

  const allInstalments = getInstalmentsRaw().map((r) => instalmentForMonth(r, month));
  const activeInstalments = allInstalments.filter((i) => i.active);
  const recurring = getRecurring();
  const mn = monthNumber(month);
  const dueRecurring = recurring.filter((r) => r.due_months.includes(mn));

  const catMonths: CategoryMonth[] = categories.map((c) => {
    const instItems = activeInstalments
      .filter((i) => i.category_id === c.id)
      .map((i) => ({ id: i.id, name: i.name, monthly: i.monthly }));
    const recItems = dueRecurring
      .filter((r) => r.category_id === c.id)
      .map((r) => ({ id: r.id, name: r.name, amount: r.amount }));
    const auto =
      instItems.reduce((s, i) => s + i.monthly, 0) +
      recItems.reduce((s, r) => s + r.amount, 0);
    const p = planned.get(c.id) || 0;
    return {
      ...c,
      planned: p,
      auto_planned: Math.round(auto * 100) / 100,
      actual: Math.round((actualByCat.get(c.id) || 0) * 100) / 100,
      tentative_total: Math.round((tentByCat.get(c.id) || 0) * 100) / 100,
      total_planned: Math.round((p + auto) * 100) / 100,
      instalment_items: instItems,
      recurring_items: recItems,
    };
  });

  const buckets: BucketSummary[] = BUCKETS.map((b) => {
    const cats = catMonths.filter((c) => c.bucket === b);
    const bp = cats.reduce((s, c) => s + c.total_planned, 0);
    const ba = cats.reduce((s, c) => s + c.actual, 0);
    const target =
      b === "needs"
        ? settings.needs_pct
        : b === "wants"
          ? settings.wants_pct
          : settings.savings_pct;
    return {
      bucket: b,
      planned: Math.round(bp * 100) / 100,
      actual: Math.round(ba * 100) / 100,
      target_pct: target,
      planned_pct_of_income: total_income > 0 ? Math.round((bp / total_income) * 1000) / 10 : 0,
      actual_pct_of_income: total_income > 0 ? Math.round((ba / total_income) * 1000) / 10 : 0,
    };
  });

  const totalPlanned = buckets.reduce((s, b) => s + b.planned, 0);
  const closed = !!d.prepare("SELECT 1 FROM month_closes WHERE month = ?").get(month);

  return {
    month,
    settings,
    incomes,
    total_income: Math.round(total_income * 100) / 100,
    income_by_person,
    categories: catMonths,
    buckets,
    instalments: activeInstalments,
    tentative: expenses.filter((e) => e.tentative),
    expenses,
    unallocated: Math.round((total_income - totalPlanned) * 100) / 100,
    closed,
  };
}

export function copyPlanFromMonth(fromMonth: string, toMonth: string): number {
  const d = db();
  const rows = d
    .prepare("SELECT category_id, planned FROM plans WHERE month = ?")
    .all(fromMonth) as { category_id: number; planned: number }[];
  const up = d.prepare(
    `INSERT INTO plans (month, category_id, planned) VALUES (?, ?, ?)
     ON CONFLICT(month, category_id) DO UPDATE SET planned = excluded.planned`
  );
  const tx = d.transaction(() => {
    for (const r of rows) up.run(toMonth, r.category_id, r.planned);
    // also copy incomes if target month has none
    const has = d.prepare("SELECT COUNT(*) AS c FROM income_sources WHERE month = ?").get(toMonth) as { c: number };
    if (has.c === 0) {
      const incs = d
        .prepare("SELECT person_id, name, amount FROM income_sources WHERE month = ?")
        .all(fromMonth) as { person_id: number; name: string; amount: number }[];
      const insInc = d.prepare(
        "INSERT INTO income_sources (month, person_id, name, amount) VALUES (?, ?, ?, ?)"
      );
      for (const i of incs) insInc.run(toMonth, i.person_id, i.name, i.amount);
    }
  });
  tx();
  return rows.length;
}

export function surprisePreview(
  month: string,
  categoryId: number,
  amount: number
): SurprisePreview {
  const bundle = getMonthBundle(month);
  const cat = bundle.categories.find((c) => c.id === categoryId);
  if (!cat) throw new Error("Category not found");
  const bucket = bundle.buckets.find((b) => b.bucket === cat.bucket)!;
  const after = bucket.actual + amount;
  const overflow = Math.max(0, after - bucket.planned);

  // headroom = money that can actually be moved out of the category's plan:
  // capped both by unspent budget and by the user-set planned amount
  // (auto_planned from instalments/recurring is committed and not reallocatable)
  const headroomOf = (c: CategoryMonth) =>
    Math.max(
      0,
      Math.round(Math.min(c.planned, c.total_planned - c.actual - c.tentative_total) * 100) / 100
    );
  const suggestions: SurpriseSuggestion[] = [];
  let remainingToCover = amount;
  const candidates = bundle.categories
    .filter((c) => c.id !== categoryId && !c.is_buffer)
    .map((c) => ({ c, headroom: headroomOf(c) }))
    .filter((x) => x.headroom > 0)
    .sort((a, b) => {
      // prefer wants bucket, then same bucket, then largest headroom
      const rank = (bucket_: Bucket) => (bucket_ === "wants" ? 0 : bucket_ === cat.bucket ? 1 : 2);
      const ra = rank(a.c.bucket);
      const rb = rank(b.c.bucket);
      if (ra !== rb) return ra - rb;
      return b.headroom - a.headroom;
    });

  // buffer category first if it exists and has planned money
  const buffer = bundle.categories.find((c) => c.is_buffer);
  if (buffer) {
    const headroom = headroomOf(buffer);
    if (headroom > 0) {
      const take = Math.min(headroom, remainingToCover);
      suggestions.push({
        category_id: buffer.id,
        category_name: buffer.name,
        bucket: buffer.bucket,
        remaining: headroom,
        take: Math.round(take * 100) / 100,
      });
      remainingToCover -= take;
    }
  }

  for (const { c, headroom } of candidates) {
    if (remainingToCover <= 0 || suggestions.length >= 4) break;
    const take = Math.min(headroom, remainingToCover);
    suggestions.push({
      category_id: c.id,
      category_name: c.name,
      bucket: c.bucket,
      remaining: headroom,
      take: Math.round(take * 100) / 100,
    });
    remainingToCover -= take;
  }

  return {
    category_id: categoryId,
    bucket: cat.bucket,
    amount,
    bucket_planned: bucket.planned,
    bucket_actual_before: bucket.actual,
    bucket_actual_after: Math.round(after * 100) / 100,
    overflow: Math.round(overflow * 100) / 100,
    suggestions,
  };
}

export function applyReallocation(
  month: string,
  moves: { from_category_id: number; to_category_id: number; amount: number }[]
) {
  const d = db();
  const get = d.prepare("SELECT planned FROM plans WHERE month = ? AND category_id = ?");
  const up = d.prepare(
    `INSERT INTO plans (month, category_id, planned) VALUES (?, ?, ?)
     ON CONFLICT(month, category_id) DO UPDATE SET planned = excluded.planned`
  );
  const tx = d.transaction(() => {
    for (const m of moves) {
      const from = (get.get(month, m.from_category_id) as { planned: number } | undefined)?.planned || 0;
      const to = (get.get(month, m.to_category_id) as { planned: number } | undefined)?.planned || 0;
      // never take more than the source plan actually holds — a plan can't go negative
      const taken = Math.min(Math.max(from, 0), m.amount);
      if (taken <= 0) continue;
      up.run(month, m.from_category_id, Math.round((from - taken) * 100) / 100);
      up.run(month, m.to_category_id, Math.round((to + taken) * 100) / 100);
    }
  });
  tx();
}

export function getYearSummary(year: number): YearMonthSummary[] {
  const out: YearMonthSummary[] = [];
  for (let m = 1; m <= 12; m++) {
    const month = `${year}-${String(m).padStart(2, "0")}`;
    const b = getMonthBundle(month);
    out.push({
      month,
      income: b.total_income,
      planned: Math.round(b.buckets.reduce((s, x) => s + x.planned, 0) * 100) / 100,
      actual: Math.round(b.buckets.reduce((s, x) => s + x.actual, 0) * 100) / 100,
      closed: b.closed,
      buckets: b.buckets,
    });
  }
  return out;
}

export function getUnspent(month: string) {
  const bundle = getMonthBundle(month);
  return bundle.categories
    .filter((c) => c.total_planned - c.actual > 0.005 && c.total_planned > 0)
    .map((c) => ({
      category_id: c.id,
      name: c.name,
      bucket: c.bucket,
      unspent: Math.round((c.total_planned - c.actual) * 100) / 100,
    }));
}
