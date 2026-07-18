"use client";

import { euro } from "@/lib/client";
import { monthName } from "@/lib/months";
import { Icon } from "@/components/Icon";
import type { MonthBundle } from "@/lib/types";

function monthProgressPct(month: string): number {
  const now = new Date();
  const current = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  if (month < current) return 100;
  if (month > current) return 0;
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return Math.round((now.getDate() / daysInMonth) * 100);
}

export function IncomeCard({ bundle }: { bundle: MonthBundle }) {
  const progress = monthProgressPct(bundle.month);
  const planned = bundle.buckets.reduce((s, b) => s + b.planned, 0);
  const actual = bundle.buckets.reduce((s, b) => s + b.actual, 0);
  const unallocated = bundle.unallocated;

  return (
    <div className="card p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="label-caps text-faint mb-1">
            Total Income • {monthName(bundle.month)}
          </p>
          <h2 className="text-4xl font-bold tracking-tight data-mono">
            {euro(bundle.total_income)}
          </h2>
        </div>
        {unallocated !== 0 && (
          <span
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full label-caps ${
              unallocated > 0 ? "bg-mint text-emerald-deep" : "bg-error-light text-error"
            }`}
          >
            <Icon
              name={unallocated > 0 ? "trending_up" : "trending_down"}
              size={14}
              fill
            />
            {euro(unallocated, { sign: true, decimals: 0 })}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-sm text-muted">
          <span>Month Progress</span>
          <span className="data-mono">{progress}% Complete</span>
        </div>
        <div className="h-2 w-full bg-lav rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${progress}%`, background: "#0a1b3d" }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-5 pt-5 border-t border-line">
        <div>
          <p className="label-caps text-faint mb-1">Planned</p>
          <p className="text-xl font-semibold data-mono">{euro(planned, { decimals: 0 })}</p>
        </div>
        <div>
          <p className="label-caps text-faint mb-1">Actual</p>
          <p className="text-xl font-semibold data-mono text-emerald">
            {euro(actual, { decimals: 0 })}
          </p>
        </div>
      </div>
    </div>
  );
}
