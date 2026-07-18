"use client";

import { euro } from "@/lib/client";
import type { MonthBundle } from "@/lib/types";
import { BUCKETS } from "./shared";

export function AllocationBar({ bundle }: { bundle: MonthBundle }) {
  const income = bundle.total_income;
  const totalPlanned = bundle.buckets.reduce((s, b) => s + b.planned, 0);
  const unallocated = bundle.unallocated;
  const over = unallocated < 0;
  const pctLeft = income > 0 ? (unallocated / income) * 100 : 0;

  // segment fractions of income (clamped for display)
  function frac(v: number) {
    return income > 0 ? Math.max(0, Math.min(1, v / income)) : 0;
  }
  const segs = BUCKETS.map((m) => {
    const b = bundle.buckets.find((x) => x.bucket === m.bucket);
    const planned = b?.planned ?? 0;
    return { meta: m, planned, w: frac(planned) };
  });
  const remainder = income > 0 ? Math.max(0, unallocated / income) : 0;

  return (
    <section className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-bold leading-tight">Remaining to Allocate</p>
          <p className="text-sm text-muted mt-0.5">
            <span className="data-mono">{euro(unallocated)}</span> of{" "}
            <span className="data-mono">{euro(income)}</span> total income
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-bold ${
            over ? "bg-error-light text-error" : "bg-mint text-emerald-deep"
          }`}
        >
          {over ? `${Math.round(Math.abs(pctLeft))}% Over` : `${Math.round(pctLeft)}% Left`}
        </span>
      </div>

      {/* stacked segmented bar */}
      <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-lav">
        {segs.map((s) => (
          <div
            key={s.meta.bucket}
            style={{ width: `${s.w * 100}%`, background: s.meta.color }}
            className="h-full transition-all duration-500"
          />
        ))}
        {remainder > 0 && (
          <div style={{ width: `${remainder * 100}%` }} className="h-full bg-lav" />
        )}
      </div>

      {/* dot legend with live % per bucket */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {segs.map((s) => {
          const b = bundle.buckets.find((x) => x.bucket === s.meta.bucket);
          const p = b?.planned_pct_of_income ?? 0;
          return (
            <span key={s.meta.bucket} className="inline-flex items-center gap-1.5 text-xs">
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: s.meta.color }}
              />
              <span className="text-muted">{s.meta.name}</span>
              <span className="data-mono text-faint">({Math.round(p)}%)</span>
            </span>
          );
        })}
        <span className="inline-flex items-center gap-1.5 text-xs">
          <span className="w-2 h-2 rounded-full bg-lav border border-line" />
          <span className="text-muted">Remaining</span>
          <span className="data-mono text-faint">
            ({income > 0 ? Math.round((Math.max(0, unallocated) / income) * 100) : 0}%)
          </span>
        </span>
      </div>

      {/* subtle total planned note */}
      <p className="mt-3 text-[11px] text-faint">
        <span className="data-mono">{euro(totalPlanned)}</span> planned across all buckets
      </p>
    </section>
  );
}
