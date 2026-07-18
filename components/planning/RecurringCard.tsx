"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { Modal } from "@/components/Modal";
import { CurrencyInput } from "@/components/CurrencyInput";
import { Segmented } from "@/components/Segmented";
import { api, euro } from "@/lib/client";
import { monthNumber } from "@/lib/months";
import type { CategoryMonth, OwnerTag, Recurring, Settings } from "@/lib/types";
import { ErrorText, OwnerPill, ownerOptions } from "./shared";

const MONTH_LETTERS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

type Schedule = "annual" | "quarterly" | "semester" | "custom";

function prefillFor(schedule: Schedule, currentMonthNum: number): number[] {
  if (schedule === "quarterly") return [1, 4, 7, 10];
  if (schedule === "semester") return [4, 10];
  if (schedule === "annual") return [currentMonthNum];
  return [];
}

function RecurringModal({
  open,
  onClose,
  editing,
  month,
  categories,
  settings,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  editing: Recurring | null;
  month: string;
  categories: CategoryMonth[];
  settings: Settings | null;
  onSaved: () => void;
}) {
  const household = settings?.mode === "household";
  const owners = ownerOptions(settings);
  const curMonthNum = monthNumber(month);
  const [name, setName] = useState(editing?.name ?? "");
  const [amount, setAmount] = useState(editing ? String(editing.amount) : "");
  const [schedule, setSchedule] = useState<Schedule>(editing?.schedule ?? "annual");
  const [dueMonths, setDueMonths] = useState<number[]>(
    editing?.due_months ?? prefillFor("annual", curMonthNum)
  );
  const [categoryId, setCategoryId] = useState<number>(
    editing?.category_id ?? categories[0]?.id ?? 0
  );
  const [owner, setOwner] = useState<OwnerTag>(editing?.owner_tag ?? (household ? "joint" : null));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function pickSchedule(s: Schedule) {
    setSchedule(s);
    if (s !== "custom") setDueMonths(prefillFor(s, curMonthNum));
  }
  function toggleMonth(m: number) {
    setDueMonths((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m].sort((a, b) => a - b)
    );
  }

  async function submit() {
    if (!name.trim() || !Number(amount) || !categoryId || dueMonths.length === 0) {
      setErr("Enter a name, amount, category and at least one due month.");
      return;
    }
    setBusy(true);
    setErr(null);
    const body = {
      name: name.trim(),
      category_id: categoryId,
      amount: Number(amount),
      schedule,
      due_months: dueMonths,
      owner_tag: household ? owner : null,
    };
    try {
      if (editing) {
        await api(`/api/recurring/${editing.id}`, { method: "PUT", body });
      } else {
        await api("/api/recurring", { method: "POST", body });
      }
      onClose();
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!editing) return;
    setBusy(true);
    setErr(null);
    try {
      await api(`/api/recurring/${editing.id}`, { method: "DELETE" });
      onClose();
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Edit recurring" : "New recurring expense"}>
      <div className="space-y-4">
        <div>
          <label className="label-caps text-faint">Name</label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Car Insurance"
            className="mt-1 w-full rounded-(--radius-field) border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-navy"
          />
        </div>
        <div>
          <label className="label-caps text-faint">Amount per occurrence</label>
          <div className="mt-1">
            <CurrencyInput value={amount} onChange={setAmount} />
          </div>
        </div>
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
          <label className="label-caps text-faint">Schedule</label>
          <div className="mt-2">
            <Segmented<Schedule>
              value={schedule}
              onChange={pickSchedule}
              options={[
                { value: "annual", label: "Annual" },
                { value: "quarterly", label: "Quarterly" },
                { value: "semester", label: "Semester" },
                { value: "custom", label: "Custom" },
              ]}
            />
          </div>
        </div>
        <div>
          <label className="label-caps text-faint">Due months</label>
          <div className="mt-2 grid grid-cols-6 gap-2">
            {MONTH_LETTERS.map((letter, i) => {
              const m = i + 1;
              const active = dueMonths.includes(m);
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => toggleMonth(m)}
                  className={`aspect-square rounded-lg text-sm font-bold border transition ${
                    active
                      ? "bg-navy text-white border-navy"
                      : "bg-white text-muted border-line"
                  }`}
                >
                  {letter}
                </button>
              );
            })}
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
        <ErrorText msg={err} />
        <div className="flex gap-2">
          {editing && (
            <button
              onClick={remove}
              disabled={busy}
              className="rounded-full bg-error-light text-error px-4 py-3 font-semibold active:scale-[0.99] transition disabled:opacity-50"
            >
              <Icon name="delete" size={20} />
            </button>
          )}
          <button
            onClick={submit}
            disabled={busy}
            className="flex-1 rounded-full bg-navy-deep text-white py-3 font-semibold active:scale-[0.99] transition disabled:opacity-50"
          >
            {busy ? "Saving…" : editing ? "Save changes" : "Add recurring"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function RecurringCard({
  month,
  categories,
  settings,
  onMutate,
}: {
  month: string;
  categories: CategoryMonth[];
  settings: Settings | null;
  /** notify parent so month bundle (auto_planned) refreshes too */
  onMutate: () => void;
}) {
  const [items, setItems] = useState<Recurring[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Recurring | null>(null);
  const household = settings?.mode === "household";

  const load = useCallback(() => {
    setLoading(true);
    api<Recurring[]>("/api/recurring")
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function onSaved() {
    load();
    onMutate();
  }

  return (
    <section className="card p-5">
      <div className="flex items-center gap-2">
        <Icon name="event_repeat" size={20} className="text-navy-soft" />
        <h2 className="text-lg font-bold flex-1">Yearly &amp; Recurring</h2>
      </div>

      <div className="mt-4 space-y-1">
        {loading && <p className="text-sm text-faint">Loading…</p>}
        {!loading && items.length === 0 && (
          <p className="text-sm text-faint">No recurring expenses yet.</p>
        )}
        {items.map((r) => (
          <button
            key={r.id}
            onClick={() => {
              setEditing(r);
              setModalOpen(true);
            }}
            className="w-full flex items-center gap-3 py-2.5 border-b border-line last:border-b-0 text-left"
          >
            <span className="w-9 h-9 rounded-xl bg-lav flex items-center justify-center text-navy shrink-0">
              <Icon name={r.icon || "event_repeat"} fill size={18} />
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold truncate">{r.name}</span>
                {household && <OwnerPill settings={settings} tag={r.owner_tag} />}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="rounded-full bg-slate-surface px-2 py-0.5 text-[10px] font-semibold text-muted capitalize">
                  {r.schedule}
                </span>
                <span className="flex items-center gap-0.5">
                  {MONTH_LETTERS.map((letter, i) => (
                    <span
                      key={i}
                      className={`text-[9px] font-bold w-3 text-center ${
                        r.due_months.includes(i + 1) ? "text-navy" : "text-line"
                      }`}
                    >
                      {letter}
                    </span>
                  ))}
                </span>
              </div>
            </div>
            <span className="data-mono text-sm shrink-0">{euro(r.amount)}</span>
          </button>
        ))}
      </div>

      <button
        onClick={() => {
          setEditing(null);
          setModalOpen(true);
        }}
        className="mt-3 w-full py-2.5 text-sm font-semibold text-muted flex items-center justify-center gap-1.5 border border-dashed border-line rounded-(--radius-field) active:scale-[0.99] transition"
      >
        <Icon name="add" size={18} /> Add recurring
      </button>

      <RecurringModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editing={editing}
        month={month}
        categories={categories}
        settings={settings}
        onSaved={onSaved}
      />
    </section>
  );
}
