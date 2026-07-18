"use client";

import { useEffect, useRef } from "react";
import { useMonth } from "@/components/MonthContext";
import { Icon } from "@/components/Icon";
import { monthNumber, yearOf } from "@/lib/months";

const ABBR = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

export function MonthChips() {
  const { month, setMonth } = useMonth();
  const year = yearOf(month);
  const selected = monthNumber(month); // 1-12
  const scrollerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [month]);

  const stepYear = (delta: number) => {
    setMonth(`${year + delta}-${String(selected).padStart(2, "0")}`);
  };

  return (
    <div className="flex items-center gap-1">
      <style>{`.review-chip-scroller::-webkit-scrollbar{display:none}`}</style>
      <button
        onClick={() => stepYear(-1)}
        className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-muted active:scale-95 transition"
        aria-label="Previous year"
      >
        <Icon name="chevron_left" size={20} />
      </button>

      <div
        ref={scrollerRef}
        className="review-chip-scroller flex-1 flex gap-2 overflow-x-auto py-1"
        style={{ scrollbarWidth: "none" }}
      >
        {ABBR.map((abbr, i) => {
          const m = i + 1;
          const active = m === selected;
          return (
            <button
              key={abbr}
              ref={active ? activeRef : null}
              onClick={() => setMonth(`${year}-${String(m).padStart(2, "0")}`)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-bold tracking-wide transition ${
                active
                  ? "bg-navy-deep text-white shadow-sm"
                  : "text-faint hover:text-muted"
              }`}
            >
              {abbr}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => stepYear(1)}
        className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-muted active:scale-95 transition"
        aria-label="Next year"
      >
        <Icon name="chevron_right" size={20} />
      </button>
    </div>
  );
}
