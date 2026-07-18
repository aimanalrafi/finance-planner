"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { api, euro } from "@/lib/client";
import type { CategoryMonth, MonthBundle, Settings } from "@/lib/types";
import { ErrorText } from "./shared";

export function AdvisorCard({
  bundle,
  settings,
  month,
  refresh,
}: {
  bundle: MonthBundle;
  settings: Settings | null;
  month: string;
  refresh: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const unallocated = bundle.unallocated;
  const savingsPct = settings?.savings_pct ?? 0;

  // preferred target category: a buffer, else any savings category
  const target: CategoryMonth | undefined =
    bundle.categories.find((c) => c.is_buffer) ??
    bundle.categories.find((c) => c.bucket === "savings");

  async function applyToTarget() {
    if (!target) return;
    setBusy(true);
    setErr(null);
    try {
      await api("/api/plans", {
        method: "PUT",
        body: {
          month,
          items: [{ category_id: target.id, planned: target.planned + unallocated }],
        },
      });
      refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to apply");
    } finally {
      setBusy(false);
    }
  }

  let body: React.ReactNode;
  let canApply = false;
  if (Math.abs(unallocated) < 0.01) {
    body = (
      <p className="text-sm text-white/85 leading-relaxed">
        Every euro is allocated. Your plan is perfectly balanced against your{" "}
        {savingsPct}% savings target — nicely done.
      </p>
    );
  } else if (unallocated > 0) {
    canApply = !!target;
    body = (
      <p className="text-sm text-white/85 leading-relaxed">
        Allocating your remaining{" "}
        <span className="data-mono font-semibold text-mint-strong">{euro(unallocated)}</span>{" "}
        {target ? (
          <>
            to <span className="font-semibold text-white">&lsquo;{target.name}&rsquo;</span> would
            strengthen your {savingsPct}% savings target.
          </>
        ) : (
          <>would strengthen your {savingsPct}% savings target — add a savings category to apply it.</>
        )}
      </p>
    );
  } else {
    body = (
      <p className="text-sm text-white/85 leading-relaxed">
        You&apos;ve over-allocated by{" "}
        <span className="data-mono font-semibold text-amber-soft">
          {euro(Math.abs(unallocated))}
        </span>
        . Trim a category or two so your plan fits your income.
      </p>
    );
  }

  return (
    <section
      className="rounded-(--radius-card) p-5 text-white"
      style={{ background: "linear-gradient(135deg, #0a1b3d 0%, #060d1f 100%)" }}
    >
      <div className="flex items-center gap-2">
        <Icon name="lightbulb" fill size={20} className="text-mint-strong" />
        <p className="label-caps text-mint-strong">Advisor Insight</p>
      </div>
      <div className="mt-2">{body}</div>
      {canApply && (
        <button
          onClick={applyToTarget}
          disabled={busy}
          className="mt-4 rounded-full bg-white text-navy-deep px-5 py-2.5 text-sm font-bold active:scale-[0.98] transition disabled:opacity-60"
        >
          {busy ? "Applying…" : "Apply"}
        </button>
      )}
      <ErrorText msg={err} />
    </section>
  );
}
