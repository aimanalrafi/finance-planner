"use client";

import { euro } from "@/lib/client";
import { Icon } from "@/components/Icon";
import { ProgressBar } from "@/components/ProgressBar";
import type { Bucket, BucketSummary } from "@/lib/types";

const CONFIG: Record<
  Bucket,
  { label: string; icon: string; tone: "navy" | "emerald" | "amber"; iconClass: string }
> = {
  needs: { label: "Needs", icon: "foundation", tone: "navy", iconClass: "text-navy" },
  wants: { label: "Wants", icon: "storefront", tone: "emerald", iconClass: "text-emerald" },
  savings: { label: "Savings", icon: "savings", tone: "amber", iconClass: "text-amber" },
};

export function BucketCard({ bucket }: { bucket: BucketSummary }) {
  const cfg = CONFIG[bucket.bucket];
  const over = bucket.actual > bucket.planned;

  return (
    <div className="card p-5 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-lav rounded-lg">
            <Icon name={cfg.icon} fill size={22} className={cfg.iconClass} />
          </div>
          <span className="text-lg font-bold">{cfg.label}</span>
        </div>
        <span className="label-caps bg-chip text-chip-ink px-2 py-1 rounded">
          {bucket.target_pct}% Target
        </span>
      </div>

      <div className="flex justify-between items-end mb-2">
        <p className="text-3xl font-bold data-mono leading-none">
          {euro(bucket.actual, { decimals: 0 })}
        </p>
        <p className="text-sm text-faint">of {euro(bucket.planned, { decimals: 0 })}</p>
      </div>

      <ProgressBar value={bucket.actual} max={bucket.planned} tone={cfg.tone} height={6} />

      {over && (
        <p className="mt-2 label-caps text-error flex items-center gap-1">
          <Icon name="warning" size={14} fill />
          {euro(bucket.actual - bucket.planned, { decimals: 0 })} over budget
        </p>
      )}
    </div>
  );
}
