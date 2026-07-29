"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/Modal";
import { CurrencyInput } from "@/components/CurrencyInput";
import { Icon } from "@/components/Icon";
import { useMonth } from "@/components/MonthContext";
import { api, euro } from "@/lib/client";
import type { Bucket, CategoryMonth, OwnerTag, SurprisePreview } from "@/lib/types";
import { ImpactGauge } from "./ImpactGauge";

const BUCKET_LABEL: Record<Bucket, string> = {
  needs: "Needs",
  wants: "Wants",
  savings: "Savings",
};

const BUCKET_ORDER: Bucket[] = ["needs", "wants", "savings"];

// Chip styling per bucket tone (Needs=navy, Wants=emerald, Savings=amber).
const BUCKET_CHIP: Record<Bucket, string> = {
  needs: "bg-chip text-chip-ink",
  wants: "bg-mint text-emerald-deep",
  savings: "bg-cream text-amber",
};

const STEP_TITLE = ["Something came up?", "The impact", "All set"];

type SuggestRow = { take: string; checked: boolean };

export function SurpriseFlow({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { month, bundle, settings, refresh } = useMonth();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [ownerTag, setOwnerTag] = useState<OwnerTag>(null);

  const [preview, setPreview] = useState<SurprisePreview | null>(null);
  const [rows, setRows] = useState<SuggestRow[]>([]);
  const [summary, setSummary] = useState<string>("");

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Reset wizard state whenever the modal is closed.
  useEffect(() => {
    if (open) return;
    setStep(1);
    setName("");
    setAmount("");
    setCategoryId(null);
    setOwnerTag(null);
    setPreview(null);
    setRows([]);
    setSummary("");
    setBusy(false);
    setErr(null);
  }, [open]);

  const categories = useMemo(
    () => (bundle?.categories ?? []).filter((c) => !c.archived && !c.auto_paid),
    [bundle],
  );

  const grouped = useMemo(() => {
    const map: Record<Bucket, CategoryMonth[]> = { needs: [], wants: [], savings: [] };
    for (const c of categories) map[c.bucket].push(c);
    return map;
  }, [categories]);

  const selectedCategory = categories.find((c) => c.id === categoryId) ?? null;
  const amountNum = Number(amount) || 0;
  const household = settings?.mode === "household";
  const persons = settings?.persons ?? [];

  const step1Valid =
    name.trim().length > 0 && amountNum > 0 && categoryId !== null;

  async function seeImpact() {
    if (!step1Valid || categoryId === null) return;
    setBusy(true);
    setErr(null);
    try {
      const p = await api<SurprisePreview>("/api/surprise", {
        method: "POST",
        body: { month, category_id: categoryId, amount: amountNum },
      });
      setPreview(p);
      setRows(initRows(p));
      setStep(2);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't calculate the impact");
    } finally {
      setBusy(false);
    }
  }

  // Pre-check suggestions top-down until their cumulative take covers the amount.
  function initRows(p: SurprisePreview): SuggestRow[] {
    let acc = 0;
    return p.suggestions.map((s) => {
      const stillShort = acc < p.amount;
      const checked = stillShort && s.take > 0;
      if (checked) acc += s.take;
      return { take: s.take > 0 ? String(s.take) : "", checked };
    });
  }

  const covered = useMemo(
    () =>
      rows.reduce(
        (sum, r) => (r.checked ? sum + (Number(r.take) || 0) : sum),
        0,
      ),
    [rows],
  );
  const fullyCovered = preview ? covered + 1e-6 >= preview.amount : false;

  function toggleRow(i: number) {
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, checked: !r.checked } : r)));
  }
  function setRowTake(i: number, v: string) {
    setRows((rs) =>
      rs.map((r, j) => {
        if (j !== i) return r;
        // a category can never give more than it has available
        const cap = preview?.suggestions[i]?.remaining ?? Infinity;
        const n = Number(v);
        const take = Number.isFinite(n) && n > cap ? String(cap) : v;
        return { ...r, take };
      }),
    );
  }

  async function apply(withMoves: boolean) {
    if (!preview || categoryId === null) return;
    setBusy(true);
    setErr(null);
    const moves = withMoves
      ? rows
          .map((r, i) => ({ row: r, sug: preview.suggestions[i] }))
          .filter(({ row }) => row.checked && (Number(row.take) || 0) > 0)
          .map(({ row, sug }) => ({
            from_category_id: sug.category_id,
            amount: Number(row.take),
            name: sug.category_name,
          }))
      : [];
    try {
      await api("/api/surprise/apply", {
        method: "POST",
        body: {
          month,
          name: name.trim(),
          category_id: categoryId,
          amount: amountNum,
          owner_tag: household ? ownerTag ?? undefined : undefined,
          moves: moves.map(({ from_category_id, amount }) => ({
            from_category_id,
            amount,
          })),
        },
      });
      const catName = selectedCategory?.name ?? "the category";
      const moveText = moves.length
        ? "; moved " +
          moves.map((m) => `${euro(m.amount, { decimals: 0 })} from ${m.name}`).join(", ")
        : "";
      setSummary(`Logged ${euro(amountNum)} to ${catName}${moveText}`);
      setStep(3);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't update the plan");
    } finally {
      setBusy(false);
    }
  }

  function finish() {
    refresh();
    onClose();
  }

  const ownerOptions: { value: OwnerTag; label: string }[] = [
    { value: "p1", label: persons.find((p) => p.id === 1)?.name ?? "Person 1" },
    { value: "p2", label: persons.find((p) => p.id === 2)?.name ?? "Person 2" },
    { value: "joint", label: "Joint" },
  ];

  return (
    <Modal open={open} onClose={onClose} title={STEP_TITLE[step - 1]}>
      {err && (
        <p className="mb-4 text-sm text-error bg-error-light rounded-lg px-3 py-2">
          {err}
        </p>
      )}

      {/* STEP 1 — Log it */}
      {step === 1 && (
        <div className="flex flex-col gap-5">
          <label className="flex flex-col gap-1.5">
            <span className="label-caps text-faint">What happened?</span>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Car repair, Vet visit"
              className="rounded-(--radius-field) border border-line bg-slate-surface px-4 py-3 text-base outline-none focus:border-navy focus:ring-2 focus:ring-chip"
            />
          </label>

          <div className="flex flex-col gap-1.5">
            <span className="label-caps text-faint">How much?</span>
            <CurrencyInput value={amount} onChange={setAmount} amber large />
          </div>

          <div className="flex flex-col gap-2">
            <span className="label-caps text-faint">Which category?</span>
            {categories.length === 0 ? (
              <p className="text-sm text-muted">No categories yet.</p>
            ) : (
              BUCKET_ORDER.map((b) =>
                grouped[b].length === 0 ? null : (
                  <div key={b} className="flex flex-col gap-1.5">
                    <span className="text-xs text-faint">{BUCKET_LABEL[b]}</span>
                    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                      {grouped[b].map((c) => {
                        const active = c.id === categoryId;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setCategoryId(c.id)}
                            className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm transition ${
                              active
                                ? "bg-navy text-white border-navy"
                                : "bg-white text-ink border-line"
                            }`}
                          >
                            <Icon
                              name={c.icon || "category"}
                              size={18}
                              className={active ? "text-white" : "text-muted"}
                            />
                            {c.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ),
              )
            )}
          </div>

          {household && (
            <div className="flex flex-col gap-2">
              <span className="label-caps text-faint">Whose is it?</span>
              <div className="flex gap-2">
                {ownerOptions.map((o) => {
                  const active = ownerTag === o.value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() =>
                        setOwnerTag((prev) => (prev === o.value ? null : o.value))
                      }
                      className={`rounded-full border px-4 py-2 text-sm transition ${
                        active
                          ? "bg-navy text-white border-navy"
                          : "bg-white text-ink border-line"
                      }`}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <button
            type="button"
            disabled={!step1Valid || busy}
            onClick={seeImpact}
            className="mt-1 rounded-(--radius-field) bg-navy text-white font-semibold py-3.5 active:scale-[0.99] transition disabled:opacity-40"
          >
            {busy ? "Calculating…" : "See Impact"}
          </button>
        </div>
      )}

      {/* STEP 2 — Impact */}
      {step === 2 && preview && (
        <div className="flex flex-col gap-5">
          <div className="card p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="label-caps text-faint">
                {BUCKET_LABEL[preview.bucket]} budget
              </span>
              <span className={`rounded-full px-2.5 py-1 label-caps ${BUCKET_CHIP[preview.bucket]}`}>
                {BUCKET_LABEL[preview.bucket]}
              </span>
            </div>
            <ImpactGauge
              bucket={preview.bucket}
              planned={preview.bucket_planned}
              before={preview.bucket_actual_before}
              after={preview.bucket_actual_after}
              overflow={preview.overflow}
            />
            <p className="mt-4 text-sm text-ink">
              This pushes {BUCKET_LABEL[preview.bucket]} to{" "}
              <span className="data-mono">{euro(preview.bucket_actual_after)}</span> of{" "}
              <span className="data-mono">{euro(preview.bucket_planned)}</span>.
            </p>
            {preview.overflow > 0 && (
              <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-error-light text-error text-sm px-3 py-1">
                <Icon name="warning" size={16} fill />
                <span className="data-mono">{euro(preview.overflow, { decimals: 0 })}</span>{" "}
                over budget
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <span className="label-caps text-faint">Where should it come from?</span>
            {preview.suggestions.length === 0 ? (
              <p className="text-sm text-muted">
                No categories with spare room. You can still log it.
              </p>
            ) : (
              preview.suggestions.map((s, i) => {
                const row = rows[i];
                if (!row) return null;
                return (
                  <div
                    key={s.category_id}
                    className={`rounded-(--radius-field) border p-3 transition ${
                      row.checked ? "border-navy bg-lav" : "border-line bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => toggleRow(i)}
                        aria-pressed={row.checked}
                        className={`shrink-0 w-6 h-6 rounded-md border flex items-center justify-center transition ${
                          row.checked
                            ? "bg-navy border-navy text-white"
                            : "bg-white border-line text-transparent"
                        }`}
                      >
                        <Icon name="check" size={16} fill />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleRow(i)}
                        className="flex-1 min-w-0 text-left"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{s.category_name}</span>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${BUCKET_CHIP[s.bucket]}`}
                          >
                            {BUCKET_LABEL[s.bucket]}
                          </span>
                        </div>
                        <span className="text-xs text-faint">
                          <span className="data-mono">{euro(s.remaining, { decimals: 0 })}</span>{" "}
                          available
                        </span>
                      </button>
                      {row.checked && (
                        <div className="shrink-0 w-28">
                          <CurrencyInput
                            value={row.take}
                            onChange={(v) => setRowTake(i, v)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {preview.suggestions.length > 0 && (
              <p
                className={`text-sm font-semibold ${
                  fullyCovered ? "text-emerald" : "text-amber"
                }`}
              >
                Covered <span className="data-mono">{euro(covered)}</span> of{" "}
                <span className="data-mono">{euro(preview.amount)}</span>
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => apply(true)}
              className="rounded-(--radius-field) bg-navy text-white font-semibold py-3.5 active:scale-[0.99] transition disabled:opacity-40"
            >
              {busy ? "Adjusting…" : "Confirm & Adjust Plan"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => apply(false)}
              className="rounded-(--radius-field) text-muted font-semibold py-2.5 active:scale-[0.99] transition disabled:opacity-40"
            >
              Skip — just log it
            </button>
          </div>
        </div>
      )}

      {/* STEP 3 — Done */}
      {step === 3 && (
        <div className="flex flex-col items-center text-center gap-4 py-4">
          <div className="w-16 h-16 rounded-full bg-mint flex items-center justify-center">
            <Icon name="check" size={34} fill className="text-emerald" />
          </div>
          <h3 className="text-xl font-bold">Plan updated</h3>
          <p className="text-sm text-muted max-w-xs">{summary}</p>
          <button
            type="button"
            onClick={finish}
            className="mt-2 w-full rounded-(--radius-field) bg-navy text-white font-semibold py-3.5 active:scale-[0.99] transition"
          >
            Done
          </button>
        </div>
      )}
    </Modal>
  );
}
