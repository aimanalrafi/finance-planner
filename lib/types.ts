export type Bucket = "needs" | "wants" | "savings";
export type OwnerTag = "p1" | "p2" | "joint" | null;
export type Framework = "50/30/20" | "70/20/10" | "zero" | "pyf" | "custom";

export interface Settings {
  mode: "solo" | "household";
  framework: Framework;
  needs_pct: number;
  wants_pct: number;
  savings_pct: number;
  onboarded: boolean;
  surprise_alert_pct: number;
  persons: { id: number; name: string }[];
}

export interface Category {
  id: number;
  bucket: Bucket;
  name: string;
  icon: string;
  owner_tag: OwnerTag;
  is_buffer: boolean;
  invest_type: string | null;
  archived: boolean;
  sort: number;
}

export interface IncomeSource {
  id: number;
  month: string;
  person_id: number;
  name: string;
  amount: number;
}

export interface Expense {
  id: number;
  month: string;
  category_id: number;
  name: string;
  amount: number;
  spent_on: string | null;
  owner_tag: OwnerTag;
  tentative: boolean;
  surprise: boolean;
  note: string | null;
  created_at: string;
}

export interface Instalment {
  id: number;
  name: string;
  icon: string;
  category_id: number;
  total: number;
  months: number;
  start_month: string;
  owner_tag: OwnerTag;
  /* derived for a given month */
  monthly: number;
  paid_count: number;   // how many instalment months are in the past relative to viewed month (inclusive)
  active: boolean;      // is it active in the viewed month
  end_month: string;
}

export interface Recurring {
  id: number;
  name: string;
  icon: string;
  category_id: number;
  amount: number;
  schedule: "annual" | "quarterly" | "semester" | "custom";
  due_months: number[];
  owner_tag: OwnerTag;
}

export interface CategoryMonth extends Category {
  planned: number;          // user planned amount
  auto_planned: number;     // instalment + recurring portions landing this month
  actual: number;           // confirmed expenses (incl. surprise, excl. tentative)
  tentative_total: number;
  total_planned: number;    // planned + auto_planned
  instalment_items: { id: number; name: string; monthly: number }[];
  recurring_items: { id: number; name: string; amount: number }[];
}

export interface BucketSummary {
  bucket: Bucket;
  planned: number;
  actual: number;
  target_pct: number;
  planned_pct_of_income: number;
  actual_pct_of_income: number;
}

export interface MonthBundle {
  month: string;
  settings: Settings;
  incomes: IncomeSource[];
  total_income: number;
  income_by_person: Record<number, number>;
  categories: CategoryMonth[];
  buckets: BucketSummary[];
  instalments: Instalment[];       // active this month
  tentative: Expense[];
  expenses: Expense[];             // all expenses of the month (confirmed + tentative)
  unallocated: number;             // income - total planned across buckets
  closed: boolean;
}

export interface SurpriseSuggestion {
  category_id: number;
  category_name: string;
  bucket: Bucket;
  remaining: number;   // how much headroom that category has
  take: number;        // suggested amount to take from it
}

export interface SurprisePreview {
  category_id: number;
  bucket: Bucket;
  amount: number;
  bucket_planned: number;
  bucket_actual_before: number;
  bucket_actual_after: number;
  overflow: number;                 // how far over the bucket budget this pushes
  suggestions: SurpriseSuggestion[];
}

export interface YearMonthSummary {
  month: string;
  income: number;
  planned: number;
  actual: number;
  closed: boolean;
  buckets: BucketSummary[];
}
