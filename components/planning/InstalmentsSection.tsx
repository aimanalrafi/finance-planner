"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { Modal } from "@/components/Modal";
import { CurrencyInput } from "@/components/CurrencyInput";
import { api, euro } from "@/lib/client";
import { addMonths, monthLabel } from "@/lib/months";
import type { CategoryMonth, Instalment, OwnerTag, Settings } from "@/lib/types";
import { IconPicker } from "./IconPicker";
import { ErrorText, OwnerPill, ownerOptions } from "./shared";

function Pips({ paid, total }: { paid: number; total: number }) {
  const n = Math.min(total, 12);
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: n }).map((_, i) => (
        <span
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${i < paid ? "bg-navy" : "bg-line"}`}
        />
      ))}
      {total > 12 && <span className="text-[10px] text-faint ml-0.5">+{total - 12}</span>}
    </div>
  );
}

function InstalmentModal({
  open,
  onClose,
  editing,
  month,
  categories,
  settings,
  refresh,
}: {
  open: boolean;
  onClose: () => void;
  editing: Instalment | null;
  month: string;
  categories: CategoryMonth[];
  settings: Settings | null;
  refresh: () => void;
}) {
  const household = settings?.mode === "household";
  const owners = ownerOptions(settings);
  const [name, setName] = useState(editing?.name ?? "");
  const [icon, setIcon] = useState(editing?.icon ?? "credit_card");
  const [total, setTotal] = useState(editing ? String(editing.total) : "");
  const [months, setMonths] = useState(editing?.months ?? 3);
  const [startMonth, setStartMonth] = useState(editing?.start_month ?? month);
  const [categoryId, setCategoryId] = useState<number>(
    editing?.category_id ?? categories[0]?.id ?? 0
  );
  const [owner, setOwner] = useState<OwnerTag>(editing?.owner_tag ?? (household ? "joint" : null));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const monthly = Number(total) && months > 0 ? Number(total) / months : 0;

  async function submit() {
    if (!name.trim() || !Number(total) || !categoryId) {
      setErr("Enter a name, total and category.");
      return;
    }
    setBusy(true);
    setErr(null);
    const body = {
      name: name.trim(),
      icon,
      category_id: categoryId,
      total: Number(total),
      months,
      start_month: startMonth,
      owner_tag: household ? owner : null,
    };
    try {
      if (editing) {
        await api(`/api/instalments/${editing.id}`, { method: "PUT", body });
      } else {
        await api("/api/instalments", { method: "POST", body });
      }
      onClose();
      refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to save instalment");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!editing) return;
    setBusy(true);
    setErr(null);
    try {
      await api(`/api/instalments/${editing.id}`, { method: "DELETE" });
      onClose();
      refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setBusy(false);
    }
  }

  // options for start month: 6 back to 6 forward
  const startOptions = Array.from({ length: 13 }, (_, i) => addMonths(month, i - 6));

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Edit instalment" : "New instalment"}>
      <div className="space-y-4">
        <div>
          <label className="label-caps text-faint">Name</label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Tokyo Flights"
            className="mt-1 w-full rounded-(--radius-field) border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-navy"
          />
        </div>

        <div>
          <label className="label-caps text-faint">Total amount</label>
          <div className="mt-1">
            <CurrencyInput value={total} onChange={setTotal} large />
          </div>
        </div>

        <div>
          <label className="label-caps text-faint">Split over</label>
          <div className="mt-1 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMonths((m) => Math.max(1, m - 1))}
              className="w-10 h-10 rounded-full border border-line flex items-center justify-center text-muted active:scale-95"
            >
              <Icon name="remove" size={20} />
            </button>
            <div className="flex-1 text-center">
              <p className="data-mono text-lg font-semibold">{months} months</p>
              <p className="text-xs text-emerald-deep data-mono">{euro(monthly)}/month</p>
            </div>
            <button
              type="button"
              onClick={() => setMonths((m) => Math.min(120, m + 1))}
              className="w-10 h-10 rounded-full border border-line flex items-center justify-center text-muted active:scale-95"
            >
              <Icon name="add" size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-caps text-faint">Start month</label>
            <select
              value={startMonth}
              onChange={(e) => setStartMonth(e.target.value)}
              className="mt-1 w-full rounded-(--radius-field) border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-navy"
            >
              {startOptions.map((m) => (
                <option key={m} value={m}>
                  {monthLabel(m)}
                </option>
              ))}
            </select>
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
        </div>

        <div>
          <label className="label-caps text-faint">Icon</label>
          <div className="mt-2">
            <IconPicker value={icon} onChange={setIcon} />
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
            {busy ? "Saving…" : editing ? "Save changes" : "Add instalment"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function InstalmentsSection({
  instalments,
  month,
  categories,
  settings,
  refresh,
}: {
  instalments: Instalment[];
  month: string;
  categories: CategoryMonth[];
  settings: Settings | null;
  refresh: () => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Instalment | null>(null);
  const household = settings?.mode === "household";

  function openNew() {
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(i: Instalment) {
    setEditing(i);
    setModalOpen(true);
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-bold">Active Instalments</h2>
        {instalments.length > 0 && (
          <span className="rounded-full bg-chip px-2.5 py-0.5 text-xs font-semibold text-chip-ink">
            {instalments.length} payment{instalments.length === 1 ? "" : "s"} this month
          </span>
        )}
      </div>

      {instalments.length === 0 && (
        <p className="text-sm text-faint">No instalments active this month.</p>
      )}

      {instalments.map((i) => (
        <button
          key={i.id}
          onClick={() => openEdit(i)}
          className="card w-full p-4 flex items-center gap-3 text-left active:scale-[0.99] transition"
        >
          <span className="w-11 h-11 rounded-xl bg-navy flex items-center justify-center text-mint-strong shrink-0">
            <Icon name={i.icon || "credit_card"} fill size={22} />
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm truncate">{i.name}</span>
              <span className="text-xs text-faint whitespace-nowrap">(Split {i.months})</span>
              {household && <OwnerPill settings={settings} tag={i.owner_tag} />}
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <Pips paid={i.paid_count} total={i.months} />
              <span className="text-[11px] text-faint">ends {monthLabel(i.end_month)}</span>
            </div>
          </div>
          <span className="data-mono font-semibold shrink-0">{euro(i.monthly)}</span>
        </button>
      ))}

      <button
        onClick={openNew}
        className="dashed-card w-full py-3 text-sm font-semibold text-muted flex items-center justify-center gap-1.5 active:scale-[0.99] transition"
      >
        <Icon name="add" size={18} /> Add instalment
      </button>

      <InstalmentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editing={editing}
        month={month}
        categories={categories}
        settings={settings}
        refresh={refresh}
      />
    </section>
  );
}
