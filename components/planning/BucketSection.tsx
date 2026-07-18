"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { CurrencyInput } from "@/components/CurrencyInput";
import { ProgressBar } from "@/components/ProgressBar";
import { euro } from "@/lib/client";
import type { BucketSummary, CategoryMonth, Settings } from "@/lib/types";
import { AddCategoryModal } from "./AddCategoryModal";
import { BucketMeta, OwnerPill } from "./shared";

/** Green when planned% is close to the target%, amber when drifting, faint when far. */
function proximityClass(plannedPct: number, target: number): string {
  const diff = Math.abs(plannedPct - target);
  if (diff <= 2) return "text-emerald-deep";
  if (diff <= 8) return "text-amber";
  return "text-faint";
}

function CategoryRow({
  cat,
  meta,
  settings,
  draftValue,
  onChange,
}: {
  cat: CategoryMonth;
  meta: BucketMeta;
  settings: Settings | null;
  draftValue: string;
  onChange: (v: string) => void;
}) {
  const household = settings?.mode === "household";
  const plannedNum = Number(draftValue) || 0;
  const total = plannedNum + cat.auto_planned;

  return (
    <div className="py-3 border-b border-line last:border-b-0">
      <div className="flex items-center gap-3">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${meta.chipBg} ${meta.chipText}`}
        >
          <Icon name={cat.is_buffer ? "shield" : cat.icon || "category"} fill size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-semibold truncate">{cat.name}</span>
            {household && <OwnerPill settings={settings} tag={cat.owner_tag} />}
            {cat.is_buffer && (
              <span className="inline-flex items-center rounded-full bg-lav px-2 py-0.5 text-[10px] font-bold text-navy">
                BUFFER
              </span>
            )}
            {cat.invest_type && (
              <span className="inline-flex items-center rounded-full bg-cream px-2 py-0.5 text-[10px] font-semibold text-amber">
                {cat.invest_type}
              </span>
            )}
          </div>
        </div>
        <div className="w-24 shrink-0">
          <CurrencyInput value={draftValue} onChange={onChange} />
        </div>
      </div>

      {/* actual progress under the category */}
      {(cat.actual > 0 || total > 0) && (
        <div className="mt-2 pl-12 pr-1">
          <ProgressBar value={cat.actual} max={total} tone={meta.tone} height={5} />
          <div className="flex justify-between mt-1 text-[10px] text-faint">
            <span className="data-mono">{euro(cat.actual)} spent</span>
            <span className="data-mono">of {euro(total)}</span>
          </div>
        </div>
      )}

      {/* auto rows: instalments + recurring (non-editable) */}
      {(cat.instalment_items.length > 0 || cat.recurring_items.length > 0) && (
        <div className="mt-2 pl-12 pr-1 space-y-1.5">
          {cat.instalment_items.map((it) => (
            <div key={`i-${it.id}`} className="flex items-center gap-2 text-xs">
              <Icon name="credit_card" size={15} className="text-faint" />
              <span className="text-muted truncate flex-1">{it.name}</span>
              <span className="rounded-full bg-cream px-1.5 py-0.5 text-[10px] font-bold text-amber">
                AUTO
              </span>
              <span className="data-mono text-faint">{euro(it.monthly)}/mo</span>
            </div>
          ))}
          {cat.recurring_items.map((it) => (
            <div key={`r-${it.id}`} className="flex items-center gap-2 text-xs">
              <Icon name="event_repeat" size={15} className="text-faint" />
              <span className="text-muted truncate flex-1">{it.name}</span>
              <span className="rounded-full bg-cream px-1.5 py-0.5 text-[10px] font-bold text-amber">
                AUTO
              </span>
              <span className="data-mono text-faint">{euro(it.amount)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function BucketSection({
  meta,
  summary,
  categories,
  income,
  settings,
  draft,
  onPlannedChange,
  refresh,
}: {
  meta: BucketMeta;
  summary: BucketSummary | undefined;
  categories: CategoryMonth[];
  income: number;
  settings: Settings | null;
  draft: Record<number, string>;
  onPlannedChange: (id: number, v: string) => void;
  refresh: () => void;
}) {
  const [open, setOpen] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  const plannedOf = (c: CategoryMonth) =>
    Number(draft[c.id] ?? String(c.planned)) || 0;
  const bucketTotal = categories.reduce((s, c) => s + plannedOf(c) + c.auto_planned, 0);
  const livePct = income > 0 ? (bucketTotal / income) * 100 : 0;
  const target = summary?.target_pct ?? 0;

  return (
    <section className="card overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-stretch gap-3 p-4 text-left"
      >
        <span className={`w-1 rounded-full ${meta.accentClass} shrink-0`} />
        <span
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${meta.chipBg} ${meta.chipText}`}
        >
          <Icon name={meta.icon} fill size={22} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-bold leading-tight">{meta.name}</p>
          <p className="text-xs text-faint truncate">{meta.subtitle}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="data-mono font-semibold">{euro(bucketTotal)}</p>
          <p className={`text-xs font-semibold ${proximityClass(livePct, target)}`}>
            {Math.round(livePct)}% of income
          </p>
        </div>
        <Icon
          name={open ? "expand_less" : "expand_more"}
          size={22}
          className="text-muted self-center shrink-0"
        />
      </button>

      {open && (
        <div className="px-4 pb-4">
          <p className="label-caps text-faint mb-1">Target {Math.round(target)}%</p>
          {categories.length === 0 && (
            <p className="text-sm text-faint py-2">No categories yet.</p>
          )}
          {categories.map((c) => (
            <CategoryRow
              key={c.id}
              cat={c}
              meta={meta}
              settings={settings}
              draftValue={draft[c.id] ?? String(c.planned)}
              onChange={(v) => onPlannedChange(c.id, v)}
            />
          ))}

          <button
            onClick={() => setAddOpen(true)}
            className="mt-3 w-full py-2.5 text-sm font-semibold text-muted flex items-center justify-center gap-1.5 active:scale-[0.99] transition dashed-card"
          >
            <Icon name="add" size={18} /> Add Category
          </button>
        </div>
      )}

      <AddCategoryModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        bucket={meta.bucket}
        bucketName={meta.name}
        settings={settings}
        refresh={refresh}
      />
    </section>
  );
}
