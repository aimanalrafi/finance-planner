"use client";

import { useEffect, useRef, useState } from "react";
import { api, euro } from "@/lib/client";
import { shortMonthName } from "@/lib/months";
import { Icon } from "@/components/Icon";
import type { YearMonthSummary } from "@/lib/types";
import { BUCKET_META, BUCKET_ORDER, bucketProportions } from "./helpers";

function StatCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="card p-3 text-center">
      <p className="label-caps text-faint mb-1 text-[10px]">{label}</p>
      <p className={`data-mono font-bold text-sm ${tone}`}>{euro(value, { decimals: 0 })}</p>
    </div>
  );
}

function MiniBar({ buckets }: { buckets: YearMonthSummary["buckets"] }) {
  const parts = bucketProportions(buckets);
  const hasData = parts.some((p) => p.pct > 0);
  if (!hasData) return <div className="h-1.5 rounded-full bg-lav" />;
  return (
    <div className="h-1.5 rounded-full overflow-hidden flex bg-lav">
      {parts.map((p) => (
        <div
          key={p.bucket}
          style={{ width: `${p.pct}%`, background: BUCKET_META[p.bucket].color }}
        />
      ))}
    </div>
  );
}

export function YearView({
  initialYear,
  onBackToMonth,
  onSelectMonth,
}: {
  initialYear: number;
  onBackToMonth: () => void;
  onSelectMonth: (month: string) => void;
}) {
  const [year, setYear] = useState(initialYear);
  const [data, setData] = useState<YearMonthSummary[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cache = useRef<Map<number, YearMonthSummary[]>>(new Map());

  useEffect(() => {
    const cached = cache.current.get(year);
    if (cached) {
      setData(cached);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    api<YearMonthSummary[]>(`/api/year/${year}`)
      .then((d) => {
        if (cancelled) return;
        cache.current.set(year, d);
        setData(d);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load year");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [year]);

  const totalIncome = data?.reduce((s, m) => s + m.income, 0) ?? 0;
  const totalSpent = data?.reduce((s, m) => s + m.actual, 0) ?? 0;
  const net = totalIncome - totalSpent;
  const maxActual = Math.max(1, ...(data?.map((m) => Math.max(m.actual, m.planned)) ?? [1]));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={onBackToMonth}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white border border-line text-sm font-semibold text-muted active:scale-95 transition"
        >
          <Icon name="calendar_view_month" size={18} />
          Month
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setYear((y) => y - 1)}
            className="w-8 h-8 rounded-full bg-white border border-line flex items-center justify-center active:scale-95 transition"
            aria-label="Previous year"
          >
            <Icon name="chevron_left" size={20} className="text-muted" />
          </button>
          <span className="font-bold text-lg data-mono w-14 text-center">{year}</span>
          <button
            onClick={() => setYear((y) => y + 1)}
            className="w-8 h-8 rounded-full bg-white border border-line flex items-center justify-center active:scale-95 transition"
            aria-label="Next year"
          >
            <Icon name="chevron_right" size={20} className="text-muted" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Income YTD" value={totalIncome} tone="text-emerald" />
        <StatCard label="Spent YTD" value={totalSpent} tone="text-ink" />
        <StatCard label="Net YTD" value={net} tone={net >= 0 ? "text-emerald" : "text-error"} />
      </div>

      {error && (
        <p className="text-error bg-error-light rounded-lg px-3 py-2 text-sm">{error}</p>
      )}
      {loading && !data && (
        <p className="text-sm text-muted text-center py-6">Loading {year}…</p>
      )}

      {data && (
        <>
          <div className="card overflow-hidden">
            {data.map((m, i) => {
              const over = m.actual > m.planned;
              const hasData = m.actual > 0 || m.planned > 0;
              return (
                <button
                  key={m.month}
                  onClick={() => onSelectMonth(m.month)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left active:bg-lav transition ${
                    i > 0 ? "border-t border-line" : ""
                  }`}
                >
                  <div className="w-10 shrink-0 flex items-center gap-1">
                    <span className="text-sm font-bold text-muted">{shortMonthName(m.month)}</span>
                    {m.closed && <span className="w-1.5 h-1.5 rounded-full bg-emerald" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <span className="text-xs text-faint data-mono">
                        P {euro(m.planned, { decimals: 0 })}
                      </span>
                      <span
                        className={`text-sm font-bold data-mono ${
                          !hasData ? "text-faint" : over ? "text-error" : "text-emerald"
                        }`}
                      >
                        A {euro(m.actual, { decimals: 0 })}
                      </span>
                    </div>
                    <MiniBar buckets={m.buckets} />
                  </div>
                </button>
              );
            })}
          </div>

          <div className="card p-4">
            <p className="label-caps text-faint mb-3">Actual vs Planned</p>
            <div className="flex items-end justify-between gap-1 h-32">
              {data.map((m) => {
                const over = m.actual > m.planned;
                const hasData = m.actual > 0;
                const barH = (Math.max(m.actual, 0) / maxActual) * 100;
                const planH = (Math.max(m.planned, 0) / maxActual) * 100;
                return (
                  <button
                    key={m.month}
                    onClick={() => onSelectMonth(m.month)}
                    className="flex-1 flex flex-col items-center gap-1 group"
                  >
                    <div className="relative w-full flex-1 flex items-end">
                      {/* planned tick behind */}
                      {m.planned > 0 && (
                        <div
                          className="absolute left-0 right-0 border-t-2 border-dashed border-navy-soft/40"
                          style={{ bottom: `${planH}%` }}
                        />
                      )}
                      <div
                        className="w-full rounded-t-sm transition-all"
                        style={{
                          height: hasData ? `${Math.max(barH, 3)}%` : "3px",
                          background: !hasData
                            ? "var(--color-lav)"
                            : over
                              ? "var(--color-error)"
                              : "var(--color-emerald)",
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-faint">
                      {shortMonthName(m.month).charAt(0)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 text-xs text-muted">
            {BUCKET_ORDER.map((b) => (
              <span key={b} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: BUCKET_META[b].color }}
                />
                {BUCKET_META[b].label}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
