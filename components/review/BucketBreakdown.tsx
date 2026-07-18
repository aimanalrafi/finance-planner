"use client";

import { euro } from "@/lib/client";
import { Icon } from "@/components/Icon";
import type { BucketSummary } from "@/lib/types";
import { BUCKET_META, bucketChip, deltaIsGood, sortBuckets } from "./helpers";

function BucketCard({ b }: { b: BucketSummary }) {
  const meta = BUCKET_META[b.bucket];
  const chip = bucketChip(b.bucket, b.planned, b.actual);
  const isSavings = b.bucket === "savings";
  const delta = b.actual - b.planned;
  const good = deltaIsGood(b.bucket, delta);

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-full bg-lav flex items-center justify-center">
          <Icon name={meta.icon} fill size={20} className="text-ink" />
        </div>
        <span className={`px-2.5 py-1 rounded-full label-caps ${chip.className}`}>
          {chip.label}
        </span>
      </div>

      <h3 className="text-lg font-bold mb-3">{meta.label}</h3>

      <div className="flex items-center justify-between text-sm mb-1.5">
        <span className="text-muted">{isSavings ? "Target" : "Planned"}</span>
        <span className="data-mono text-muted">{euro(b.planned)}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted">Actual</span>
        <span className="data-mono font-bold text-ink">{euro(b.actual)}</span>
      </div>

      <div className="my-3 border-t border-dashed border-line" />

      <div className="flex items-center justify-between">
        <span className="label-caps text-faint">Delta</span>
        <span className={`data-mono font-bold ${good ? "text-emerald" : "text-error"}`}>
          {euro(delta, { sign: true })}
        </span>
      </div>
    </div>
  );
}

export function BucketBreakdown({ buckets }: { buckets: BucketSummary[] }) {
  const ordered = sortBuckets(buckets);
  return (
    <section>
      <h2 className="text-xl font-bold mb-3">Bucket Breakdown</h2>
      <div className="flex flex-col gap-3">
        {ordered.map((b) => (
          <BucketCard key={b.bucket} b={b} />
        ))}
      </div>
    </section>
  );
}
