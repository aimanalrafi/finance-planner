"use client";

import { euro } from "@/lib/client";
import { monthName } from "@/lib/months";
import { Icon } from "@/components/Icon";
import type { Expense, MonthBundle } from "@/lib/types";

function subtitle(bundle: MonthBundle, e: Expense): string {
  const cat = bundle.categories.find((c) => c.id === e.category_id);
  const catName = cat?.name ?? "Uncategorized";
  let day = "";
  if (e.spent_on) {
    const d = Number(e.spent_on.split("-")[2]);
    if (!Number.isNaN(d)) day = `${monthName(bundle.month)} ${d} • `;
  }
  return `${day}${catName}`;
}

function SurpriseRow({ bundle, e }: { bundle: MonthBundle; e: Expense }) {
  return (
    <div className="relative overflow-hidden rounded-(--radius-card) bg-cream border border-amber-soft/30 p-4">
      <Icon
        name="warning"
        size={96}
        className="absolute -right-3 -bottom-6 text-amber/10 pointer-events-none select-none"
      />
      <div className="relative flex items-center gap-3">
        <div className="w-9 h-9 shrink-0 rounded-full bg-amber-soft/25 flex items-center justify-center">
          <Icon name="build" fill size={20} className="text-amber" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold truncate">{e.name}</p>
          <p className="text-xs text-muted truncate">{subtitle(bundle, e)}</p>
        </div>
        <span className="data-mono font-bold text-error whitespace-nowrap">{euro(e.amount)}</span>
      </div>
    </div>
  );
}

export function SurpriseList({ bundle }: { bundle: MonthBundle }) {
  const surprises = bundle.expenses.filter((e) => e.surprise && !e.tentative);
  return (
    <section>
      <h2 className="text-xl font-bold mb-3">Surprise Expenses</h2>
      {surprises.length === 0 ? (
        <div className="dashed-card p-6 text-center text-muted text-sm">
          No surprises this month 🎉
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {surprises.map((e) => (
            <SurpriseRow key={e.id} bundle={bundle} e={e} />
          ))}
        </div>
      )}
    </section>
  );
}
