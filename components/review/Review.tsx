"use client";

import { useState } from "react";
import { useMonth } from "@/components/MonthContext";
import { currentMonth, yearOf } from "@/lib/months";
import { MonthChips } from "./MonthChips";
import { NetPositionCard } from "./NetPositionCard";
import { BucketBreakdown } from "./BucketBreakdown";
import { SurpriseList } from "./SurpriseList";
import { CloseOut } from "./CloseOut";
import { ZoomToYearCard } from "./ZoomToYearCard";
import { YearView } from "./YearView";

type View = "month" | "year";

export function Review() {
  const { month, setMonth, bundle, loading, error } = useMonth();
  const [view, setView] = useState<View>("month");

  if (view === "year") {
    return (
      <YearView
        initialYear={yearOf(month)}
        onBackToMonth={() => setView("month")}
        onSelectMonth={(m) => {
          setMonth(m);
          setView("month");
        }}
      />
    );
  }

  const showCloseOut = bundle && (month < currentMonth() || bundle.closed);

  return (
    <div className="flex flex-col gap-6">
      <MonthChips />

      {error && (
        <p className="text-error bg-error-light rounded-lg px-3 py-2 text-sm">{error}</p>
      )}

      {!bundle && loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-9 h-9 rounded-full border-[3px] border-lav border-t-navy animate-spin" />
          <p className="text-sm text-muted">Loading…</p>
        </div>
      )}

      {bundle && (
        <>
          <NetPositionCard bundle={bundle} />
          <BucketBreakdown buckets={bundle.buckets} />
          <SurpriseList bundle={bundle} />
          {showCloseOut && <CloseOut month={month} closed={bundle.closed} />}
          <ZoomToYearCard onClick={() => setView("year")} />
        </>
      )}
    </div>
  );
}
