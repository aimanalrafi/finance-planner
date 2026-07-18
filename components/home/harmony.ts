import type { BucketSummary } from "@/lib/types";

/**
 * Harmony score: start at 100 and dock points for every bucket that spends
 * over its planned amount, proportional to how far over it went. Each bucket
 * can cost at most 30 points; the final score is clamped to [0, 100].
 */
export function harmonyScore(buckets: BucketSummary[]): number {
  let score = 100;
  for (const b of buckets) {
    if (b.planned > 0 && b.actual > b.planned) {
      const overspendRatio = (b.actual - b.planned) / b.planned;
      score -= Math.min(30, 30 * overspendRatio);
    }
  }
  return Math.max(0, Math.round(score));
}

export function harmonyMessage(score: number): string {
  if (score >= 95) return "Beautiful balance — every bucket is in harmony.";
  if (score >= 85) return "You're on track and spending with intention.";
  if (score >= 70) return "A little off-key, but nothing you can't rebalance.";
  if (score >= 50) return "Some buckets slipped over budget — time to adjust.";
  return "Spending is out of tune this month. Let's realign the plan.";
}
