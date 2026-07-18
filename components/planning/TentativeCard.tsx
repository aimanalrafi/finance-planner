"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { Modal } from "@/components/Modal";
import { CurrencyInput } from "@/components/CurrencyInput";
import { api, euro } from "@/lib/client";
import type { CategoryMonth, Expense, OwnerTag, Settings } from "@/lib/types";
import { ErrorText, OwnerPill, ownerOptions } from "./shared";

function AddTentativeModal({
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
  const [owner, setOwner] = useState<OwnerTag>(household ? "joint" : null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

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
          owner_tag: household ? owner : null,
          tentative: true,
        },
      });
      setName("");
      setAmount("");
      onClose();
      refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to add");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add tentative expense">
      <div className="space-y-4">
        <div>
          <label className="label-caps text-faint">Name</label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Concert Tickets"
            className="mt-1 w-full rounded-(--radius-field) border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-navy"
          />
        </div>
        <div>
          <label className="label-caps text-faint">Amount</label>
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
        <button
          onClick={submit}
          disabled={busy}
          className="w-full rounded-full bg-navy-deep text-white py-3 font-semibold active:scale-[0.99] transition disabled:opacity-50"
        >
          {busy ? "Adding…" : "Add tentative"}
        </button>
      </div>
    </Modal>
  );
}

export function TentativeCard({
  tentative,
  month,
  categories,
  settings,
  refresh,
}: {
  tentative: Expense[];
  month: string;
  categories: CategoryMonth[];
  settings: Settings | null;
  refresh: () => void;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const household = settings?.mode === "household";

  async function confirm(id: number) {
    setBusyId(id);
    setErr(null);
    try {
      await api(`/api/expenses/${id}`, { method: "PUT", body: { tentative: false } });
      refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to confirm");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: number) {
    setBusyId(id);
    setErr(null);
    try {
      await api(`/api/expenses/${id}`, { method: "DELETE" });
      refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="dashed-card p-5">
      <div className="flex items-center gap-2">
        <Icon name="help" size={20} className="text-amber" />
        <h2 className="text-lg font-bold flex-1">Tentative</h2>
      </div>
      <p className="text-sm text-muted mt-1">
        These expenses are anticipated but not yet committed to this month&apos;s plan.
      </p>

      <div className="mt-4 space-y-1">
        {tentative.length === 0 && (
          <p className="text-sm text-faint">Nothing tentative right now.</p>
        )}
        {tentative.map((t) => (
          <div key={t.id} className="flex items-center gap-3 py-2 border-b border-line last:border-b-0">
            <button
              onClick={() => confirm(t.id)}
              disabled={busyId === t.id}
              className="w-5 h-5 rounded-md border-2 border-line flex items-center justify-center text-white hover:border-emerald hover:bg-emerald transition shrink-0 disabled:opacity-50"
              aria-label={`Confirm ${t.name}`}
            >
              <Icon name="check" size={14} />
            </button>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium truncate">{t.name}</span>
              {household && (
                <span className="ml-1.5 align-middle">
                  <OwnerPill settings={settings} tag={t.owner_tag} />
                </span>
              )}
            </div>
            <span className="data-mono text-sm">{euro(t.amount)}</span>
            <button
              onClick={() => remove(t.id)}
              disabled={busyId === t.id}
              className="w-7 h-7 rounded-full flex items-center justify-center text-faint hover:text-error disabled:opacity-40"
              aria-label={`Delete ${t.name}`}
            >
              <Icon name="close" size={18} />
            </button>
          </div>
        ))}
      </div>

      <ErrorText msg={err} />

      <button
        onClick={() => setAddOpen(true)}
        className="mt-3 w-full py-2.5 text-sm font-semibold text-muted flex items-center justify-center gap-1.5 border border-dashed border-line rounded-(--radius-field) active:scale-[0.99] transition"
      >
        <Icon name="add" size={18} /> Add
      </button>

      <AddTentativeModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        month={month}
        categories={categories}
        settings={settings}
        refresh={refresh}
      />
    </section>
  );
}
