"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { currentMonth } from "@/lib/months";
import { Icon } from "@/components/Icon";
import { Segmented } from "@/components/Segmented";
import { CurrencyInput } from "@/components/CurrencyInput";
import {
  FrameworkChooser,
  isCustomValid,
  type CustomPcts,
} from "@/components/settings/FrameworkChooser";
import { frameworkDef } from "@/components/settings/frameworks";
import type { Framework, Settings } from "@/lib/types";

interface IncomeRow {
  key: number;
  personId: number;
  name: string;
  amount: string;
}

const TOTAL_STEPS = 4;

export default function OnboardingPage() {
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState(0);

  // Step 2 — household
  const [mode, setMode] = useState<"solo" | "household">("solo");
  const [name1, setName1] = useState("");
  const [name2, setName2] = useState("");

  // Step 3 — framework
  const [framework, setFramework] = useState<Framework>("50/30/20");
  const [custom, setCustom] = useState<CustomPcts>({ needs: "50", wants: "30", savings: "20" });

  // Step 4 — income
  const [rows, setRows] = useState<IncomeRow[]>([{ key: 1, personId: 1, name: "", amount: "" }]);
  const [nextKey, setNextKey] = useState(2);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Settings>("/api/settings")
      .then((s) => {
        if (s.onboarded) {
          window.location.href = "/";
          return;
        }
        if (s.persons?.[0]?.name) setName1(s.persons[0].name);
        if (s.persons?.[1]?.name) setName2(s.persons[1].name);
        setReady(true);
      })
      .catch(() => setReady(true));
  }, []);

  function addRow() {
    setRows((r) => [...r, { key: nextKey, personId: 1, name: "", amount: "" }]);
    setNextKey((k) => k + 1);
  }
  function updateRow(key: number, patch: Partial<IncomeRow>) {
    setRows((r) => r.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }
  function removeRow(key: number) {
    setRows((r) => (r.length > 1 ? r.filter((row) => row.key !== key) : r));
  }

  function canAdvance(): boolean {
    if (step === 1) {
      if (!name1.trim()) return false;
      if (mode === "household" && !name2.trim()) return false;
    }
    if (step === 2 && framework === "custom" && !isCustomValid(custom)) return false;
    return true;
  }

  function next() {
    setError(null);
    if (!canAdvance()) {
      setError(
        step === 1
          ? "Please enter the required name(s)"
          : "Custom percentages must total 100%"
      );
      return;
    }
    setStep((s) => Math.min(TOTAL_STEPS - 1, s + 1));
  }
  function back() {
    setError(null);
    setStep((s) => Math.max(0, s - 1));
  }

  async function finish(skipIncome = false) {
    setBusy(true);
    setError(null);
    try {
      const persons = [{ id: 1, name: name1.trim() }];
      if (mode === "household") persons.push({ id: 2, name: name2.trim() });

      const body: Record<string, unknown> = {
        mode,
        persons,
        framework,
        onboarded: true,
      };
      if (framework === "custom") {
        body.needs_pct = Number(custom.needs);
        body.wants_pct = Number(custom.wants);
        body.savings_pct = Number(custom.savings);
      }
      await api("/api/settings", { method: "PUT", body });

      const month = currentMonth();
      const valid = skipIncome
        ? []
        : rows.filter((r) => r.name.trim() && Number(r.amount) > 0);
      for (const r of valid) {
        await api("/api/incomes", {
          method: "POST",
          body: {
            month,
            person_id: mode === "household" ? r.personId : 1,
            name: r.name.trim(),
            amount: Number(r.amount),
          },
        });
      }
      window.location.href = "/";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong — try again");
      setBusy(false);
    }
  }

  if (!ready) {
    return (
      <main className="min-h-dvh flex items-center justify-center bg-surface">
        <div className="w-10 h-10 rounded-full border-[3px] border-lav border-t-navy animate-spin" />
      </main>
    );
  }

  const personName = (id: number) =>
    id === 1 ? name1.trim() || "Person 1" : name2.trim() || "Person 2";

  return (
    <main className="min-h-dvh flex flex-col bg-surface px-6 py-8">
      <div className="w-full max-w-sm mx-auto flex flex-col flex-1">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? "w-6 bg-navy" : i < step ? "w-1.5 bg-navy/40" : "w-1.5 bg-line"
              }`}
            />
          ))}
        </div>

        <div className="flex-1">
          {step === 0 && (
            <div className="flex flex-col items-center text-center pt-6 animate-slide-up">
              <div className="w-20 h-20 rounded-3xl bg-navy flex items-center justify-center mb-6 shadow-lg">
                <Icon name="savings" fill size={40} className="text-mint-strong" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">
                Plan your money with harmony
              </h1>
              <p className="text-muted mt-3 leading-relaxed">
                A calm, private space to plan every euro across your needs, wants and savings —
                and keep your household in balance.
              </p>
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-5 animate-slide-up">
              <div>
                <h2 className="text-2xl font-bold">Who&apos;s planning?</h2>
                <p className="text-muted mt-1">Just you, or a shared household?</p>
              </div>
              <Segmented
                options={[
                  { value: "solo", label: "Solo" },
                  { value: "household", label: "Household" },
                ]}
                value={mode}
                onChange={setMode}
              />
              <label className="flex flex-col gap-1.5">
                <span className="label-caps text-faint">Your name</span>
                <input
                  value={name1}
                  onChange={(e) => setName1(e.target.value)}
                  className="rounded-(--radius-field) border border-line bg-white px-4 py-3 outline-none focus:border-navy focus:ring-2 focus:ring-chip"
                  placeholder="e.g. Alex"
                />
              </label>
              {mode === "household" && (
                <label className="flex flex-col gap-1.5">
                  <span className="label-caps text-faint">Second person</span>
                  <input
                    value={name2}
                    onChange={(e) => setName2(e.target.value)}
                    className="rounded-(--radius-field) border border-line bg-white px-4 py-3 outline-none focus:border-navy focus:ring-2 focus:ring-chip"
                    placeholder="e.g. Sam"
                  />
                </label>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-4 animate-slide-up">
              <div>
                <h2 className="text-2xl font-bold">Choose a framework</h2>
                <p className="text-muted mt-1">
                  How should your income split across buckets?
                </p>
              </div>
              <FrameworkChooser
                selected={framework}
                custom={custom}
                onSelectFramework={setFramework}
                onCustomChange={setCustom}
              />
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-4 animate-slide-up">
              <div>
                <h2 className="text-2xl font-bold">What&apos;s coming in this month?</h2>
                <p className="text-muted mt-1">
                  Add your income sources. You can skip this and add them later.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                {rows.map((row) => (
                  <div key={row.key} className="card p-3 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        value={row.name}
                        onChange={(e) => updateRow(row.key, { name: e.target.value })}
                        className="flex-1 rounded-(--radius-field) border border-line bg-white px-3 py-2.5 outline-none focus:border-navy focus:ring-2 focus:ring-chip"
                        placeholder="Source (e.g. Salary)"
                      />
                      {rows.length > 1 && (
                        <button
                          onClick={() => removeRow(row.key)}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-faint"
                          aria-label="Remove source"
                        >
                          <Icon name="close" size={18} />
                        </button>
                      )}
                    </div>
                    {mode === "household" && (
                      <Segmented
                        options={[
                          { value: "1", label: personName(1) },
                          { value: "2", label: personName(2) },
                        ]}
                        value={String(row.personId)}
                        onChange={(v) => updateRow(row.key, { personId: Number(v) })}
                      />
                    )}
                    <CurrencyInput
                      value={row.amount}
                      onChange={(v) => updateRow(row.key, { amount: v })}
                    />
                  </div>
                ))}
                <button
                  onClick={addRow}
                  className="flex items-center justify-center gap-1.5 text-sm font-semibold text-emerald-deep py-2"
                >
                  <Icon name="add" size={18} />
                  Add another source
                </button>
              </div>
            </div>
          )}
        </div>

        {error && (
          <p className="mt-4 text-sm text-error bg-error-light rounded-lg px-3 py-2">{error}</p>
        )}

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-3">
          {step < TOTAL_STEPS - 1 ? (
            <button
              onClick={step === 0 ? () => setStep(1) : next}
              className="rounded-(--radius-field) bg-navy text-white font-semibold py-3.5 active:scale-[0.99] transition"
            >
              {step === 0 ? "Get Started" : "Continue"}
            </button>
          ) : (
            <button
              onClick={() => finish(false)}
              disabled={busy}
              className="rounded-(--radius-field) bg-navy text-white font-semibold py-3.5 active:scale-[0.99] transition disabled:opacity-60"
            >
              {busy ? "Setting up…" : "Finish setup"}
            </button>
          )}

          {step === TOTAL_STEPS - 1 && (
            <button
              onClick={() => finish(true)}
              disabled={busy}
              className="text-sm font-semibold text-muted py-1 disabled:opacity-60"
            >
              Skip for now
            </button>
          )}

          {step > 0 && (
            <button
              onClick={back}
              disabled={busy}
              className="text-sm font-semibold text-muted py-1 disabled:opacity-60"
            >
              Back
            </button>
          )}
        </div>

        <p className="text-center text-xs text-faint mt-6">
          {frameworkDef(framework).label} • Fiscal Harmony
        </p>
      </div>
    </main>
  );
}
