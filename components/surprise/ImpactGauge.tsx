"use client";

import type { Bucket } from "@/lib/types";
import { euro } from "@/lib/client";

const BUCKET_LABEL: Record<Bucket, string> = {
  needs: "Needs",
  wants: "Wants",
  savings: "Savings",
};

const TONE_GRADIENT: Record<Bucket, string> = {
  needs: "linear-gradient(90deg, #060d1f, #0a1b3d)", // navy
  wants: "linear-gradient(90deg, #059669, #34d399)", // emerald
  savings: "linear-gradient(90deg, #d97706, #fbbf24)", // amber
};

// Solid amber for the new expense that lands within budget.
const NEW_SOLID = "#f59e0b";
// Striped amber for the portion that overflows past the planned line.
const NEW_STRIPED =
  "repeating-linear-gradient(45deg, #f59e0b 0 6px, #fcd9a0 6px 12px)";

/**
 * Horizontal "Impact" gauge for a surprise expense.
 * - filled portion = bucket_actual_before / bucket_planned in the bucket tone
 * - the new expense's in-budget chunk appended in solid amber
 * - overflow chunk rendered striped amber, extending past the 100% marker
 */
export function ImpactGauge({
  bucket,
  planned,
  before,
  after,
  overflow,
}: {
  bucket: Bucket;
  planned: number;
  before: number;
  after: number;
  overflow: number;
}) {
  const height = 22;
  // Scale so the whole bar spans whichever is larger: the budget or the new total.
  const scaleMax = Math.max(planned, after, 1);
  const pctOf = (n: number) => `${Math.max(0, (n / scaleMax) * 100)}%`;

  const beforeW = Math.min(before, scaleMax);
  const solidW = Math.max(0, Math.min(after, planned) - before);
  const stripedW = overflow;
  const markerLeft = (planned / scaleMax) * 100;

  return (
    <div>
      <div className="relative" style={{ height }}>
        <div
          className="absolute inset-0 flex rounded-full bg-lav overflow-hidden"
          role="img"
          aria-label={`${BUCKET_LABEL[bucket]} budget impact`}
        >
          <div style={{ width: pctOf(beforeW), background: TONE_GRADIENT[bucket] }} />
          <div style={{ width: pctOf(solidW), background: NEW_SOLID }} />
          <div style={{ width: pctOf(stripedW), background: NEW_STRIPED }} />
        </div>
        {/* 100% (planned) marker */}
        <div
          className="absolute top-[-3px] bottom-[-3px] w-px bg-navy/70"
          style={{ left: `${markerLeft}%` }}
        >
          <span
            className="absolute -top-4 -translate-x-1/2 label-caps text-faint whitespace-nowrap"
            style={{ left: 0 }}
          >
            {euro(planned, { decimals: 0 })}
          </span>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between text-xs text-muted">
        <span>
          Before <span className="data-mono text-ink">{euro(before, { decimals: 0 })}</span>
        </span>
        <span>
          After{" "}
          <span
            className={`data-mono ${overflow > 0 ? "text-error" : "text-ink"}`}
          >
            {euro(after, { decimals: 0 })}
          </span>
        </span>
      </div>
    </div>
  );
}
