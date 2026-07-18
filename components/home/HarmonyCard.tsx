"use client";

import { harmonyScore, harmonyMessage } from "./harmony";
import type { BucketSummary } from "@/lib/types";

export function HarmonyCard({ buckets }: { buckets: BucketSummary[] }) {
  const score = harmonyScore(buckets);
  const message = harmonyMessage(score);

  return (
    <div className="card p-6 overflow-hidden">
      <div
        className="rounded-xl p-6 flex flex-col items-center text-center"
        style={{
          background:
            "linear-gradient(120deg, rgba(6,108,73,0.06) 0%, rgba(108,248,190,0.12) 100%)",
        }}
      >
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight">Harmony Score</span>
          <span className="text-2xl font-bold text-emerald data-mono">{score}%</span>
        </div>
        <p className="text-sm text-muted max-w-xs mt-2">{message}</p>
      </div>
    </div>
  );
}
