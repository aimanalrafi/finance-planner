"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { CurrencyInput } from "@/components/CurrencyInput";
import { ProgressBar } from "@/components/ProgressBar";
import { api, euro } from "@/lib/client";
import type { BucketSummary, CategoryMonth, Settings } from "@/lib/types";
import { AddCategoryModal } from "./AddCategoryModal";
import { BucketMeta, bucketMeta, OwnerPill } from "./shared";

/** Compact "remaining in other buckets" strip, so you don't have to leave this one to check. */
function OtherBucketsRemaining({
  current,
  allBuckets,
}: {
  current: BucketSummary["bucket"];
  allBuckets: BucketSummary[];
}) {
  const others = allBuckets.filter((b) => b.bucket !== current);
  if (others.length === 0) return null;
  return (
    <div className="flex gap-2 mb-3 flex-wrap">
      {others.map((b) => {
        const meta = bucketMeta(b.bucket);
        const remaining = Math.round((b.planned - b.actual) * 100) / 100;
        return (
          <div
            key={b.bucket}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${meta.chipBg} ${meta.chipText}`}
          >
            <Icon name={meta.icon} size={14} />
            <span>{meta.name}</span>
            <span className={`data-mono ${remaining < 0 ? "text-error" : ""}`}>
              {euro(remaining)} left
            </span>
          </div>
        );
      })}
    </div>
  );
}

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
  onNote,
  refresh,
}: {
  cat: CategoryMonth;
  meta: BucketMeta;
  settings: Settings | null;
  draftValue: string;
  onChange: (v: string) => void;
  onNote: (msg: string) => void;
  refresh: () => void;
}) {
  const household = settings?.mode === "household";
  const plannedNum = Number(draftValue) || 0;
  const total = plannedNum + cat.auto_planned;
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    try {
      const res = await api<{ archived?: boolean; deleted?: boolean }>(
        `/api/categories/${cat.id}`,
        { method: "DELETE" }
      );
      if (res.archived) {
        onNote(`"${cat.name}" has history, so it was archived instead of deleted.`);
      }
      refresh();
    } catch (e) {
      onNote(e instanceof Error ? e.message : "Failed to delete category");
    } finally {
      setBusy(false);
    }
  }

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
            {cat.auto_paid && (
              <span className="inline-flex items-center rounded-full bg-cream px-2 py-0.5 text-[10px] font-bold text-amber">
                FIXED
              </span>
            )}
          </div>
        </div>
        <div className="w-24 shrink-0">
          <CurrencyInput value={draftValue} onChange={onChange} />
        </div>
        <button
          onClick={remove}
          disabled={busy}
          aria-label={`Delete ${cat.name}`}
          className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-faint active:scale-[0.95] transition disabled:opacity-50"
        >
          <Icon name="delete" size={18} />
        </button>
      </div>

      {/* actual progress under the category, only once money has actually been spent —
          fixed costs are always considered paid, so there's nothing to show here */}
      {!cat.auto_paid && cat.actual > 0 && (
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
  allBuckets,
  categories,
  income,
  settings,
  draft,
  onPlannedChange,
  onNote,
  refresh,
}: {
  meta: BucketMeta;
  summary: BucketSummary | undefined;
  allBuckets: BucketSummary[];
  categories: CategoryMonth[];
  income: number;
  settings: Settings | null;
  draft: Record<number, string>;
  onPlannedChange: (id: number, v: string) => void;
  onNote: (msg: string) => void;
  refresh: () => void;
}) {
  const [open, setOpen] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  const fixedCats = categories.filter((c) => c.auto_paid);
  const regularCats = categories.filter((c) => !c.auto_paid);

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
          <OtherBucketsRemaining current={meta.bucket} allBuckets={allBuckets} />
          <p className="label-caps text-faint mb-1">Target {Math.round(target)}%</p>
          {categories.length === 0 && (
            <p className="text-sm text-faint py-2">No categories yet.</p>
          )}
          {fixedCats.length > 0 && (
            <>
              <p className="label-caps text-faint mt-1 mb-0.5">Fixed Costs</p>
              {fixedCats.map((c) => (
                <CategoryRow
                  key={c.id}
                  cat={c}
                  meta={meta}
                  settings={settings}
                  draftValue={draft[c.id] ?? String(c.planned)}
                  onChange={(v) => onPlannedChange(c.id, v)}
                  onNote={onNote}
                  refresh={refresh}
                />
              ))}
              <p className="label-caps text-faint mt-3 mb-0.5">Other</p>
            </>
          )}
          {regularCats.map((c) => (
            <CategoryRow
              key={c.id}
              cat={c}
              meta={meta}
              settings={settings}
              draftValue={draft[c.id] ?? String(c.planned)}
              onChange={(v) => onPlannedChange(c.id, v)}
              onNote={onNote}
              refresh={refresh}
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
