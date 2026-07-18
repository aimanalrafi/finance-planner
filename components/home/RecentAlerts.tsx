"use client";

import { useState } from "react";
import { euro } from "@/lib/client";
import { shortMonthName } from "@/lib/months";
import { Icon } from "@/components/Icon";
import type { CategoryMonth, Expense } from "@/lib/types";

const SHORT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatDate(exp: Expense): string {
  if (exp.spent_on) {
    const [, m, d] = exp.spent_on.split("-").map(Number);
    return `${SHORT_MONTHS[m - 1]} ${String(d).padStart(2, "0")}`;
  }
  return shortMonthName(exp.month);
}

export function RecentAlerts({
  expenses,
  categories,
}: {
  expenses: Expense[];
  categories: CategoryMonth[];
}) {
  const [showAll, setShowAll] = useState(false);

  const nameById = new Map(categories.map((c) => [c.id, c.name]));
  const sorted = [...expenses].sort((a, b) => {
    const ak = a.spent_on ?? a.created_at;
    const bk = b.spent_on ?? b.created_at;
    return bk < ak ? -1 : bk > ak ? 1 : b.id - a.id;
  });
  const visible = showAll ? sorted : sorted.slice(0, 4);

  return (
    <div className="card p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Recent Alerts</h3>
        {sorted.length > 4 && (
          <button
            onClick={() => setShowAll((v) => !v)}
            className="label-caps text-navy hover:underline"
          >
            {showAll ? "Show Less" : "View All"}
          </button>
        )}
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-faint py-4 text-center">No expenses logged yet.</p>
      ) : (
        <div className="flex flex-col gap-1">
          {visible.map((exp) => {
            const category = nameById.get(exp.category_id) ?? "Uncategorized";
            return (
              <div
                key={exp.id}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-surface transition-colors"
              >
                <div
                  className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center ${
                    exp.surprise ? "bg-cream text-amber" : "bg-mint text-emerald"
                  }`}
                >
                  <Icon
                    name={exp.surprise ? "priority_high" : "shopping_cart"}
                    fill={exp.surprise}
                    size={22}
                  />
                </div>

                <div className="flex-grow min-w-0">
                  <p className="font-bold truncate">{exp.name}</p>
                  <p className="text-sm text-faint truncate">
                    {formatDate(exp)} • {category}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p
                    className={`data-mono font-semibold ${
                      exp.surprise ? "text-error" : "text-ink"
                    }`}
                  >
                    {euro(exp.amount)}
                  </p>
                  {exp.tentative ? (
                    <span className="inline-block mt-1 label-caps text-[10px] bg-cream text-amber px-1.5 py-0.5 rounded">
                      Tentative
                    </span>
                  ) : exp.surprise ? (
                    <div className="flex gap-[3px] justify-end mt-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald" />
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald" />
                      <span className="w-1.5 h-1.5 rounded-full bg-line" />
                    </div>
                  ) : (
                    <p className="label-caps text-[10px] text-emerald mt-0.5">On Track</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
