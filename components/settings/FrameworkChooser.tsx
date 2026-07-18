"use client";

import type { Framework } from "@/lib/types";
import { Icon } from "@/components/Icon";
import { FRAMEWORKS } from "./frameworks";
import { StackedBar } from "./StackedBar";

export interface CustomPcts {
  needs: string;
  wants: string;
  savings: string;
}

export function customTotal(c: CustomPcts): number {
  return Number(c.needs || 0) + Number(c.wants || 0) + Number(c.savings || 0);
}

export function isCustomValid(c: CustomPcts): boolean {
  return customTotal(c) === 100;
}

function pctField(
  label: string,
  value: string,
  onChange: (v: string) => void
) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="label-caps text-faint">{label}</span>
      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(e) => {
            const v = e.target.value.replace(/[^\d]/g, "").slice(0, 3);
            if (v === "" || Number(v) <= 100) onChange(v);
          }}
          className="w-full rounded-(--radius-field) border border-line bg-white data-mono text-center text-lg py-3 pr-8 pl-3 outline-none focus:ring-2 focus:ring-chip focus:border-navy"
          placeholder="0"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-faint">%</span>
      </div>
    </label>
  );
}

export function FrameworkChooser({
  selected,
  custom,
  onSelectFramework,
  onCustomChange,
}: {
  selected: Framework;
  custom: CustomPcts;
  onSelectFramework: (id: Framework) => void;
  onCustomChange: (c: CustomPcts) => void;
}) {
  const total = customTotal(custom);
  const totalOk = total === 100;

  return (
    <div className="flex flex-col gap-2.5">
      {FRAMEWORKS.map((f) => {
        const active = selected === f.id;
        return (
          <div key={f.id}>
            <button
              type="button"
              onClick={() => onSelectFramework(f.id)}
              className={`w-full text-left rounded-(--radius-card) border p-4 transition ${
                active ? "border-navy bg-lav/60 ring-1 ring-navy" : "border-line bg-white"
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    active ? "border-navy" : "border-line"
                  }`}
                >
                  {active && <span className="w-2.5 h-2.5 rounded-full bg-navy" />}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold">{f.label}</span>
                    {f.recommended && (
                      <span className="label-caps bg-mint text-emerald-deep px-2 py-0.5 rounded-full text-[10px]">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted mt-0.5">{f.desc}</p>
                  {f.pcts && (
                    <div className="mt-2.5">
                      <StackedBar
                        needs={f.pcts[0]}
                        wants={f.pcts[1]}
                        savings={f.pcts[2]}
                        height={26}
                        compact
                      />
                    </div>
                  )}
                </div>
              </div>
            </button>

            {active && f.id === "custom" && (
              <div className="mt-2.5 rounded-(--radius-card) border border-line bg-slate-surface p-4 animate-slide-up">
                <div className="grid grid-cols-3 gap-3">
                  {pctField("Needs", custom.needs, (v) =>
                    onCustomChange({ ...custom, needs: v })
                  )}
                  {pctField("Wants", custom.wants, (v) =>
                    onCustomChange({ ...custom, wants: v })
                  )}
                  {pctField("Savings", custom.savings, (v) =>
                    onCustomChange({ ...custom, savings: v })
                  )}
                </div>
                <div
                  className={`mt-3 flex items-center justify-center gap-1.5 text-sm font-semibold ${
                    totalOk ? "text-emerald-deep" : "text-error"
                  }`}
                >
                  <Icon name={totalOk ? "check_circle" : "error"} size={16} fill />
                  Total: {total}%{totalOk ? "" : " — must equal 100%"}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
