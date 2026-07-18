"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { CurrencyInput } from "@/components/CurrencyInput";
import { api, euro } from "@/lib/client";
import type { MonthBundle, Settings } from "@/lib/types";
import { ErrorText, personName } from "./shared";

export function IncomeCard({
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
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const household = settings?.mode === "household";

  // add-row state
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [person, setPerson] = useState(1);

  async function addIncome() {
    if (!name.trim() || !Number(amount)) {
      setErr("Enter a name and amount.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await api("/api/incomes", {
        method: "POST",
        body: { month, person_id: household ? person : 1, name: name.trim(), amount: Number(amount) },
      });
      setName("");
      setAmount("");
      refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to add income");
    } finally {
      setBusy(false);
    }
  }

  async function delIncome(id: number) {
    setBusy(true);
    setErr(null);
    try {
      await api(`/api/incomes/${id}`, { method: "DELETE" });
      refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="label-caps text-faint">Total Income</p>
          <p className="text-3xl font-bold text-emerald-deep data-mono mt-1">
            {euro(bundle.total_income)}
          </p>
        </div>
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-9 h-9 rounded-full bg-slate-surface border border-line flex items-center justify-center text-muted active:scale-95 transition"
          aria-label={open ? "Close income editor" : "Edit income"}
        >
          <Icon name={open ? "expand_less" : "edit"} size={20} />
        </button>
      </div>

      {household && (
        <div className="flex flex-wrap gap-2 mt-3">
          {settings?.persons.map((p) => (
            <span
              key={p.id}
              className="inline-flex items-center gap-1.5 rounded-full bg-lav px-3 py-1 text-xs font-semibold text-chip-ink"
            >
              <Icon name="person" size={14} className="text-navy-soft" />
              {p.name}
              <span className="data-mono text-navy">
                {euro(bundle.income_by_person[p.id] ?? 0, { decimals: 0 })}
              </span>
            </span>
          ))}
        </div>
      )}

      {open && (
        <div className="mt-4 border-t border-line pt-4 space-y-2">
          {bundle.incomes.length === 0 && (
            <p className="text-sm text-faint">No income sources yet.</p>
          )}
          {bundle.incomes.map((inc) => (
            <div key={inc.id} className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{inc.name}</p>
                {household && (
                  <p className="text-[11px] text-faint">{personName(settings, inc.person_id)}</p>
                )}
              </div>
              <span className="data-mono text-sm">{euro(inc.amount)}</span>
              <button
                onClick={() => delIncome(inc.id)}
                disabled={busy}
                className="w-7 h-7 rounded-full flex items-center justify-center text-faint hover:text-error disabled:opacity-40"
                aria-label={`Delete ${inc.name}`}
              >
                <Icon name="close" size={18} />
              </button>
            </div>
          ))}

          <div className="rounded-(--radius-field) bg-slate-surface p-3 space-y-2 mt-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Source name (e.g. Salary)"
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-navy"
            />
            <div className="flex gap-2">
              <div className="flex-1">
                <CurrencyInput value={amount} onChange={setAmount} />
              </div>
              {household && (
                <select
                  value={person}
                  onChange={(e) => setPerson(Number(e.target.value))}
                  className="rounded-(--radius-field) border border-line bg-white px-3 text-sm outline-none focus:border-navy"
                >
                  {settings?.persons.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <button
              onClick={addIncome}
              disabled={busy}
              className="w-full rounded-full bg-navy text-white py-2.5 text-sm font-semibold active:scale-[0.99] transition disabled:opacity-50"
            >
              + Add income source
            </button>
          </div>
          <ErrorText msg={err} />
        </div>
      )}
    </section>
  );
}
