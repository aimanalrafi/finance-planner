"use client";

/**
 * Rounded pill split into needs / wants / savings segments sized by percentage.
 * Needs = navy, Wants = emerald, Savings = amber (per the bucket tone contract).
 */
export function StackedBar({
  needs,
  wants,
  savings,
  height = 44,
  compact = false,
}: {
  needs: number;
  wants: number;
  savings: number;
  height?: number;
  compact?: boolean;
}) {
  const total = needs + wants + savings || 1;
  const segs: { pct: number; label: string; bg: string; text: string }[] = [
    { pct: needs, label: "NEEDS", bg: "bg-navy", text: "text-white" },
    { pct: wants, label: "WANTS", bg: "bg-emerald", text: "text-white" },
    { pct: savings, label: "SAVINGS", bg: "bg-amber-soft", text: "text-navy-deep" },
  ];

  return (
    <div
      className="flex w-full overflow-hidden rounded-full"
      style={{ height }}
      role="img"
      aria-label={`Needs ${needs}%, Wants ${wants}%, Savings ${savings}%`}
    >
      {segs.map((s) => {
        const width = (s.pct / total) * 100;
        if (s.pct <= 0) return null;
        return (
          <div
            key={s.label}
            className={`flex items-center justify-center overflow-hidden ${s.bg} ${s.text}`}
            style={{ width: `${width}%` }}
          >
            {width >= (compact ? 16 : 14) && (
              <span
                className={`px-1 text-center font-semibold leading-tight ${
                  compact ? "text-[10px]" : "text-xs"
                }`}
              >
                {s.pct}%{compact ? "" : ` ${s.label}`}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
