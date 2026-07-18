"use client";

import { addMonths, monthLabel } from "@/lib/months";
import { useMonth } from "./MonthContext";
import { Icon } from "./Icon";

export function MonthSwitcher() {
  const { month, setMonth } = useMonth();
  return (
    <div className="flex items-center justify-between">
      <button
        onClick={() => setMonth(addMonths(month, -1))}
        className="w-9 h-9 rounded-full bg-white border border-line flex items-center justify-center active:scale-95 transition"
        aria-label="Previous month"
      >
        <Icon name="chevron_left" size={22} className="text-muted" />
      </button>
      <span className="font-bold text-lg">{monthLabel(month)}</span>
      <button
        onClick={() => setMonth(addMonths(month, 1))}
        className="w-9 h-9 rounded-full bg-white border border-line flex items-center justify-center active:scale-95 transition"
        aria-label="Next month"
      >
        <Icon name="chevron_right" size={22} className="text-muted" />
      </button>
    </div>
  );
}
