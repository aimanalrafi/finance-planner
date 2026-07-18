"use client";

import { useState } from "react";
import { useMonth } from "@/components/MonthContext";
import { MonthSwitcher } from "@/components/MonthSwitcher";
import { SurpriseFlow } from "@/components/surprise/SurpriseFlow";
import { IncomeCard } from "@/components/home/IncomeCard";
import { SurpriseCard } from "@/components/home/SurpriseCard";
import { BucketCard } from "@/components/home/BucketCard";
import { HarmonyCard } from "@/components/home/HarmonyCard";
import { RecentAlerts } from "@/components/home/RecentAlerts";
import { EmptyState } from "@/components/home/EmptyState";
import type { Bucket } from "@/lib/types";

const BUCKET_ORDER: Bucket[] = ["needs", "wants", "savings"];

export default function HomePage() {
  const { bundle } = useMonth();
  const [surpriseOpen, setSurpriseOpen] = useState(false);

  if (!bundle) return null;

  const plannedTotal = bundle.buckets.reduce((s, b) => s + b.planned, 0);
  const isEmpty = bundle.total_income === 0 && plannedTotal === 0;

  const buckets = BUCKET_ORDER.map((b) =>
    bundle.buckets.find((x) => x.bucket === b)
  ).filter((b): b is NonNullable<typeof b> => b != null);

  return (
    <div className="flex flex-col gap-4 animate-slide-up">
      <MonthSwitcher />

      {isEmpty ? (
        <EmptyState />
      ) : (
        <>
          <IncomeCard bundle={bundle} />
          <SurpriseCard onOpen={() => setSurpriseOpen(true)} />
          {buckets.map((b) => (
            <BucketCard key={b.bucket} bucket={b} />
          ))}
          <HarmonyCard buckets={bundle.buckets} />
          <RecentAlerts expenses={bundle.expenses} categories={bundle.categories} />
        </>
      )}

      <SurpriseFlow open={surpriseOpen} onClose={() => setSurpriseOpen(false)} />
    </div>
  );
}
