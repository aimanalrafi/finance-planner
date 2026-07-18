"use client";

import { useState } from "react";
import { api, euro } from "@/lib/client";
import { monthName } from "@/lib/months";
import { Icon } from "@/components/Icon";
import { Segmented } from "@/components/Segmented";
import { useMonth } from "@/components/MonthContext";
import type { Bucket } from "@/lib/types";

interface UnspentRow {
  category_id: number;
  name: string;
  bucket: Bucket;
  unspent: number;
}
type Action = "rollover" | "save" | "ignore";

const ACTION_OPTIONS: { value: Action; label: string }[] = [
  { value: "rollover", label: "Roll over" },
  { value: "save", label: "To savings" },
  { value: "ignore", label: "Ignore" },
];

export function CloseOut({ month, closed }: { month: string; closed: boolean }) {
  const { refresh } = useMonth();
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<UnspentRow[] | null>(null);
  const [actions, setActions] = useState<Record<number, Action>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const name = monthName(month);

  const expand = async () => {
    setExpanded(true);
    if (rows) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api<{ unspent: UnspentRow[] }>(`/api/month/${month}/close`);
      const list = data.unspent.filter((r) => r.unspent > 0);
      setRows(list);
      setActions(Object.fromEntries(list.map((r) => [r.category_id, "ignore" as Action])));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load unspent budget");
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    if (!rows) return;
    setSubmitting(true);
    setError(null);
    try {
      await api(`/api/month/${month}/close`, {
        method: "POST",
        body: {
          actions: rows.map((r) => ({
            category_id: r.category_id,
            action: actions[r.category_id] ?? "ignore",
            amount: r.unspent,
          })),
        },
      });
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to close month");
      setSubmitting(false);
    }
  };

  const reopen = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await api(`/api/month/${month}/close`, { method: "DELETE" });
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reopen month");
      setSubmitting(false);
    }
  };

  if (closed) {
    return (
      <div className="rounded-(--radius-card) bg-mint border border-mint-strong/40 p-4 flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 font-semibold text-emerald-deep">
          <Icon name="check_circle" fill size={20} className="text-emerald" />
          {name} closed
        </span>
        <button
          onClick={reopen}
          disabled={submitting}
          className="text-sm text-faint hover:text-muted underline underline-offset-2 disabled:opacity-50"
        >
          Reopen
        </button>
      </div>
    );
  }

  if (!expanded) {
    return (
      <button
        onClick={expand}
        className="w-full rounded-(--radius-card) border border-emerald bg-white p-4 flex items-center justify-between gap-3 active:scale-[0.99] transition"
      >
        <span className="flex items-center gap-2 font-semibold text-emerald-deep">
          <Icon name="event_available" fill size={20} className="text-emerald" />
          Close out {name}
        </span>
        <Icon name="chevron_right" size={22} className="text-emerald" />
      </button>
    );
  }

  return (
    <div className="card p-5 animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg">Close out {name}</h3>
        <button onClick={() => setExpanded(false)} aria-label="Collapse">
          <Icon name="expand_less" size={22} className="text-muted" />
        </button>
      </div>

      {loading && <p className="text-sm text-muted py-4 text-center">Loading unspent budget…</p>}

      {!loading && rows && rows.length === 0 && (
        <p className="text-sm text-muted py-2">No unspent budget to distribute.</p>
      )}

      {!loading && rows && rows.length > 0 && (
        <div className="flex flex-col gap-4">
          {rows.map((r) => (
            <div key={r.category_id}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">{r.name}</span>
                <span className="data-mono font-bold text-emerald">
                  {euro(r.unspent, { sign: true })}
                </span>
              </div>
              <Segmented
                options={ACTION_OPTIONS}
                value={actions[r.category_id] ?? "ignore"}
                onChange={(v) => setActions((a) => ({ ...a, [r.category_id]: v }))}
              />
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="text-error bg-error-light rounded-lg px-3 py-2 text-sm mt-4">{error}</p>
      )}

      <button
        onClick={submit}
        disabled={submitting || loading || !rows}
        className="mt-5 w-full rounded-(--radius-field) bg-navy text-white font-semibold py-3 active:scale-[0.99] transition disabled:opacity-50"
      >
        {submitting ? "Closing…" : "Close Month"}
      </button>
    </div>
  );
}
