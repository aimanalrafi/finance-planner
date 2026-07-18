"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { Modal } from "@/components/Modal";
import { CurrencyInput } from "@/components/CurrencyInput";
import { api } from "@/lib/client";
import type { CategoryMonth, OwnerTag, Settings } from "@/lib/types";
import { ErrorText, ownerOptions } from "./shared";

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function AddExpenseModal({
  open,
  onClose,
  month,
  categories,
  settings,
  refresh,
}: {
  open: boolean;
  onClose: () => void;
  month: string;
  categories: CategoryMonth[];
  settings: Settings | null;
  refresh: () => void;
}) {
  const household = settings?.mode === "household";
  const owners = ownerOptions(settings);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<number>(categories[0]?.id ?? 0);
  const [date, setDate] = useState(todayIso());
  const [owner, setOwner] = useState<OwnerTag>(household ? "joint" : null);
  const [tentative, setTentative] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function reset() {
    setName("");
    setAmount("");
    setDate(todayIso());
    setTentative(false);
  }

  async function submit() {
    if (!name.trim() || !Number(amount) || !categoryId) {
      setErr("Enter a name, amount and category.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await api("/api/expenses", {
        method: "POST",
        body: {
          month,
          category_id: categoryId,
          name: name.trim(),
          amount: Number(amount),
          spent_on: date,
          owner_tag: household ? owner : null,
          tentative,
        },
      });
      reset();
      onClose();
      refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to log expense");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Log expense">
      <div className={`space-y-4 ${tentative ? "rounded-2xl border border-dashed border-amber-soft p-3 -m-1" : ""}`}>
        <div>
          <label className="label-caps text-faint">Name</label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Grocery run"
            className="mt-1 w-full rounded-(--radius-field) border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-navy"
          />
        </div>
        <div>
          <label className="label-caps text-faint">Amount</label>
          <div className="mt-1">
            <CurrencyInput value={amount} onChange={setAmount} large />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-caps text-faint">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(Number(e.target.value))}
              className="mt-1 w-full rounded-(--radius-field) border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-navy"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-caps text-faint">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full rounded-(--radius-field) border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-navy data-mono"
            />
          </div>
        </div>
        {household && (
          <div>
            <label className="label-caps text-faint">Owner</label>
            <div className="mt-2 flex gap-2">
              {owners.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setOwner(o.value)}
                  className={`flex-1 rounded-full py-2 text-sm font-semibold border transition ${
                    owner === o.value
                      ? "bg-navy text-white border-navy"
                      : "bg-white text-muted border-line"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => setTentative((t) => !t)}
          className="w-full flex items-center justify-between rounded-(--radius-field) border border-line px-3 py-2.5"
        >
          <span className="flex items-center gap-2 text-sm font-medium">
            <Icon name="help" size={18} className="text-amber" /> Tentative
          </span>
          <span
            className={`w-10 h-6 rounded-full transition-colors relative ${
              tentative ? "bg-amber" : "bg-line"
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${
                tentative ? "left-[18px]" : "left-0.5"
              }`}
            />
          </span>
        </button>

        <ErrorText msg={err} />

        <button
          onClick={submit}
          disabled={busy}
          className="w-full rounded-full bg-emerald text-white py-3 font-semibold active:scale-[0.99] transition disabled:opacity-50"
        >
          {busy ? "Logging…" : tentative ? "Add tentative expense" : "Log expense"}
        </button>
      </div>
    </Modal>
  );
}
