"use client";

import { euro } from "@/lib/client";
import type { MonthBundle } from "@/lib/types";
import { budgetHealth } from "./helpers";

export function NetPositionCard({ bundle }: { bundle: MonthBundle }) {
  const inflow = bundle.total_income;
  // savings-bucket actuals count as outflow here (they leave the spending pool)
  const outflow = bundle.buckets.reduce((s, b) => s + b.actual, 0);
  const planned = bundle.buckets.reduce((s, b) => s + b.planned, 0);
  const net = inflow - outflow;
  const health = budgetHealth(planned, outflow);

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between gap-3 mb-2">
        <p className="label-caps text-faint">Net Position</p>
        <span className={`px-2.5 py-1 rounded-full label-caps whitespace-nowrap ${health.className}`}>
          Budget Health: {health.label}
        </span>
      </div>

      <h2
        className={`text-4xl font-bold tracking-tight data-mono ${
          net >= 0 ? "text-ink" : "text-error"
        }`}
      >
        {euro(net, { sign: true })}
      </h2>

      <div className="grid grid-cols-2 gap-4 mt-5 pt-5 border-t border-line">
        <div>
          <p className="label-caps text-faint mb-1">Total Inflow</p>
          <p className="text-xl font-semibold data-mono text-emerald">{euro(inflow)}</p>
        </div>
        <div>
          <p className="label-caps text-faint mb-1">Total Outflow</p>
          <p className="text-xl font-semibold data-mono text-ink">{euro(outflow)}</p>
        </div>
      </div>
    </div>
  );
}
