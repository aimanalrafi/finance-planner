import type { Bucket, BucketSummary } from "@/lib/types";

export interface BucketMeta {
  icon: string;
  /** solid color used for mini bars / charts */
  color: string;
  label: string;
}

export const BUCKET_META: Record<Bucket, BucketMeta> = {
  needs: { icon: "home", color: "#0a1b3d", label: "Needs" },
  wants: { icon: "shopping_bag", color: "#059669", label: "Wants" },
  savings: { icon: "savings", color: "#d97706", label: "Savings" },
};

export const BUCKET_ORDER: Bucket[] = ["needs", "wants", "savings"];

export function sortBuckets(buckets: BucketSummary[]): BucketSummary[] {
  return [...buckets].sort(
    (a, b) => BUCKET_ORDER.indexOf(a.bucket) - BUCKET_ORDER.indexOf(b.bucket)
  );
}

export interface Chip {
  label: string;
  className: string;
}

const CHIP_STYLES = {
  stable: "bg-cream text-amber",
  good: "bg-mint text-emerald-deep",
  bad: "bg-error-light text-error",
} as const;

/**
 * Status chip for a bucket by actual vs planned.
 * Non-savings: >2% over = OVER (bad), under by >5% = UNDER (good), else STABLE.
 * Savings: over target is good, so tones flip (over = good, short = bad).
 */
export function bucketChip(bucket: Bucket, planned: number, actual: number): Chip {
  const ratio = planned > 0 ? (actual - planned) / planned : actual > 0 ? 1 : 0;
  const over = ratio > 0.02;
  const under = ratio < -0.05;
  if (bucket === "savings") {
    if (over) return { label: "OVER", className: CHIP_STYLES.good };
    if (under) return { label: "UNDER", className: CHIP_STYLES.bad };
    return { label: "STABLE", className: CHIP_STYLES.stable };
  }
  if (over) return { label: "OVER", className: CHIP_STYLES.bad };
  if (under) return { label: "UNDER", className: CHIP_STYLES.good };
  return { label: "STABLE", className: CHIP_STYLES.stable };
}

/** Delta text color. Savings: over target good (positive = emerald). Others: under budget good. */
export function deltaIsGood(bucket: Bucket, delta: number): boolean {
  return bucket === "savings" ? delta >= 0 : delta <= 0;
}

export interface BudgetHealth {
  label: string;
  className: string;
}

export function budgetHealth(planned: number, actual: number): BudgetHealth {
  const overRatio = planned > 0 ? (actual - planned) / planned : actual > 0 ? 1 : 0;
  if (overRatio <= 0) return { label: "EXCELLENT", className: CHIP_STYLES.good };
  if (overRatio <= 0.05) return { label: "GOOD", className: CHIP_STYLES.stable };
  return { label: "STRAINED", className: CHIP_STYLES.bad };
}

/** Proportional widths (0-100) for a needs/wants/savings mini bar from bucket actuals. */
export function bucketProportions(buckets: BucketSummary[]): { bucket: Bucket; pct: number }[] {
  const total = buckets.reduce((s, b) => s + Math.max(b.actual, 0), 0);
  return BUCKET_ORDER.map((bucket) => {
    const found = buckets.find((b) => b.bucket === bucket);
    const actual = found ? Math.max(found.actual, 0) : 0;
    return { bucket, pct: total > 0 ? (actual / total) * 100 : 0 };
  });
}
