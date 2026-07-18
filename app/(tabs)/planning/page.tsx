"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MonthSwitcher } from "@/components/MonthSwitcher";
import { useMonth } from "@/components/MonthContext";
import { Icon } from "@/components/Icon";
import { api } from "@/lib/client";
import { addMonths, monthName } from "@/lib/months";
import type { CategoryMonth } from "@/lib/types";
import { IncomeCard } from "@/components/planning/IncomeCard";
import { AllocationBar } from "@/components/planning/AllocationBar";
import { BucketSection } from "@/components/planning/BucketSection";
import { InstalmentsSection } from "@/components/planning/InstalmentsSection";
import { TentativeCard } from "@/components/planning/TentativeCard";
import { RecurringCard } from "@/components/planning/RecurringCard";
import { AdvisorCard } from "@/components/planning/AdvisorCard";
import { AddExpenseModal } from "@/components/planning/AddExpenseModal";
import { BUCKETS } from "@/components/planning/shared";

export default function PlanningPage() {
  const { month, bundle, loading, error, refresh, settings } = useMonth();

  const [draft, setDraft] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const [startBusy, setStartBusy] = useState(false);

  // sync draft with the server bundle without clobbering in-progress edits:
  // fields the user has touched (dirtyIds) survive refresh(); a month switch resets everything
  const [dirtyIds, setDirtyIds] = useState<Set<number>>(new Set());
  const lastMonth = useRef(month);
  useEffect(() => {
    if (!bundle) return;
    const monthChanged = lastMonth.current !== month;
    lastMonth.current = month;
    if (monthChanged) setDirtyIds(new Set());
    setDraft((prev) => {
      const d: Record<number, string> = {};
      for (const c of bundle.categories) {
        d[c.id] =
          !monthChanged && dirtyIds.has(c.id) && prev[c.id] !== undefined
            ? prev[c.id]
            : String(c.planned);
      }
      return d;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bundle, month]);

  const changed: CategoryMonth[] = useMemo(() => {
    if (!bundle) return [];
    return bundle.categories.filter(
      (c) => (Number(draft[c.id] ?? c.planned) || 0) !== c.planned
    );
  }, [bundle, draft]);
  const dirty = changed.length > 0;

  function onPlannedChange(id: number, v: string) {
    setDirtyIds((prev) => new Set(prev).add(id));
    setDraft((prev) => ({ ...prev, [id]: v }));
  }

  async function savePlan(): Promise<boolean> {
    if (!bundle || changed.length === 0) return true;
    setSaving(true);
    setSaveErr(null);
    try {
      await api("/api/plans", {
        method: "PUT",
        body: {
          month,
          items: changed.map((c) => ({
            category_id: c.id,
            planned: Number(draft[c.id]) || 0,
          })),
        },
      });
      // saved fields are no longer dirty; edits made after this point stay protected
      setDirtyIds((prev) => {
        const nextSet = new Set(prev);
        for (const c of changed) nextSet.delete(c.id);
        return nextSet;
      });
      refresh();
      return true;
    } catch (e) {
      setSaveErr(e instanceof Error ? e.message : "Failed to save plan");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function confirmPlan() {
    const ok = await savePlan();
    if (ok) {
      setConfirmed(true);
      setTimeout(() => setConfirmed(false), 2200);
    }
  }

  async function startFromLast() {
    setStartBusy(true);
    try {
      await api("/api/plans", { method: "POST", body: { from: addMonths(month, -1), to: month } });
      refresh();
    } catch (e) {
      setSaveErr(e instanceof Error ? e.message : "Failed to copy plan");
    } finally {
      setStartBusy(false);
    }
  }

  if (loading && !bundle) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <div className="w-10 h-10 rounded-full border-[3px] border-lav border-t-navy animate-spin" />
        <p className="text-sm text-muted">Loading plan…</p>
      </div>
    );
  }

  if (error || !bundle) {
    return (
      <div className="text-error bg-error-light rounded-lg px-4 py-3 text-sm mt-6">
        {error || "Could not load this month."}
      </div>
    );
  }

  const categories = bundle.categories;
  const isEmpty =
    bundle.total_income === 0 && bundle.buckets.every((b) => b.planned === 0);

  return (
    <div className="space-y-5 pb-8">
      {/* 1. Header */}
      <MonthSwitcher />
      <div>
        <p className="label-caps text-faint">Monthly Sit-Down</p>
        <h1 className="text-3xl font-bold tracking-tight">Planning {monthName(month)}</h1>
      </div>

      {bundle.closed && (
        <div className="rounded-(--radius-field) bg-cream border border-amber-soft/50 px-4 py-3 flex items-start gap-2.5">
          <Icon name="lock" size={18} className="text-amber mt-0.5" />
          <p className="text-sm text-amber">
            This month is closed. You can still adjust the plan, but it&apos;s been finalised.
          </p>
        </div>
      )}

      {/* 2. Income */}
      <IncomeCard bundle={bundle} settings={settings} month={month} refresh={refresh} />

      {/* 3. Remaining to allocate */}
      <AllocationBar bundle={bundle} />

      {/* 4. Start from last month */}
      {isEmpty && (
        <div className="dashed-card p-5 text-center">
          <Icon name="content_copy" size={28} className="text-navy-soft" />
          <p className="font-bold mt-2">Start from last month</p>
          <p className="text-sm text-muted mt-1">
            Copy {monthName(addMonths(month, -1))}&apos;s plan and income into {monthName(month)} to
            get a head start.
          </p>
          <button
            onClick={startFromLast}
            disabled={startBusy}
            className="mt-4 rounded-full bg-navy text-white px-6 py-2.5 text-sm font-semibold active:scale-[0.99] transition disabled:opacity-50"
          >
            {startBusy ? "Copying…" : "Copy last month"}
          </button>
        </div>
      )}

      {/* 5. Bucket sections */}
      <div className="space-y-4">
        {BUCKETS.map((meta) => (
          <BucketSection
            key={meta.bucket}
            meta={meta}
            summary={bundle.buckets.find((b) => b.bucket === meta.bucket)}
            categories={categories.filter((c) => c.bucket === meta.bucket)}
            income={bundle.total_income}
            settings={settings}
            draft={draft}
            onPlannedChange={onPlannedChange}
            refresh={refresh}
          />
        ))}
      </div>

      {saveErr && (
        <div className="text-error bg-error-light rounded-lg px-3 py-2 text-sm">{saveErr}</div>
      )}

      {/* Confirm plan */}
      <button
        onClick={confirmPlan}
        disabled={saving}
        className={`w-full rounded-full py-4 font-bold text-white flex items-center justify-center gap-2 active:scale-[0.99] transition disabled:opacity-60 ${
          confirmed ? "bg-emerald" : "bg-navy-deep"
        }`}
      >
        {confirmed ? (
          <>
            <Icon name="check_circle" fill size={22} /> Plan confirmed
          </>
        ) : (
          <>
            Confirm {monthName(month)} Plan <Icon name="check_circle" size={22} />
          </>
        )}
      </button>

      {/* 6. Instalments */}
      <InstalmentsSection
        instalments={bundle.instalments}
        month={month}
        categories={categories}
        settings={settings}
        refresh={refresh}
      />

      {/* 7. Tentative */}
      <TentativeCard
        tentative={bundle.tentative}
        month={month}
        categories={categories}
        settings={settings}
        refresh={refresh}
      />

      {/* 8. Yearly & recurring */}
      <RecurringCard month={month} categories={categories} settings={settings} onMutate={refresh} />

      {/* 9. Advisor insight */}
      <AdvisorCard bundle={bundle} settings={settings} month={month} refresh={refresh} />

      {/* Floating Save Plan pill */}
      {dirty && (
        <div className="fixed inset-x-0 bottom-24 z-40 pointer-events-none">
          <div className="max-w-lg mx-auto px-5 flex justify-center">
            <button
              onClick={savePlan}
              disabled={saving}
              className="pointer-events-auto rounded-full bg-navy text-white px-6 py-3 text-sm font-bold shadow-[0_6px_20px_rgba(10,27,61,0.25)] flex items-center gap-2 active:scale-[0.98] transition disabled:opacity-60"
            >
              <Icon name="save" size={18} />
              {saving ? "Saving…" : `Save Plan (${changed.length})`}
            </button>
          </div>
        </div>
      )}

      {/* 10. FAB */}
      <div className="fixed inset-x-0 bottom-24 z-30 pointer-events-none">
        <div className="max-w-lg mx-auto px-5 flex justify-end">
          <button
            onClick={() => setFabOpen(true)}
            className="pointer-events-auto w-14 h-14 rounded-full bg-emerald text-white shadow-[0_6px_20px_rgba(5,150,105,0.4)] flex items-center justify-center active:scale-95 transition"
            aria-label="Log expense"
          >
            <Icon name="add" size={28} />
          </button>
        </div>
      </div>

      <AddExpenseModal
        open={fabOpen}
        onClose={() => setFabOpen(false)}
        month={month}
        categories={categories}
        settings={settings}
        refresh={refresh}
      />
    </div>
  );
}
