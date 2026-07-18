"use client";

import { useState } from "react";
import { api } from "@/lib/client";
import { Icon } from "@/components/Icon";
import { Modal } from "@/components/Modal";
import type { Framework, Settings } from "@/lib/types";
import { frameworkDef, FRAMEWORK_CAPTIONS } from "./frameworks";
import { StackedBar } from "./StackedBar";
import {
  FrameworkChooser,
  isCustomValid,
  type CustomPcts,
} from "./FrameworkChooser";

export function FrameworkCard({
  settings,
  onSaved,
}: {
  settings: Settings;
  onSaved: () => void;
}) {
  const def = frameworkDef(settings.framework);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Framework>(settings.framework);
  const [custom, setCustom] = useState<CustomPcts>({
    needs: String(settings.needs_pct),
    wants: String(settings.wants_pct),
    savings: String(settings.savings_pct),
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openModal() {
    setSelected(settings.framework);
    setCustom({
      needs: String(settings.needs_pct),
      wants: String(settings.wants_pct),
      savings: String(settings.savings_pct),
    });
    setError(null);
    setOpen(true);
  }

  const saveDisabled =
    busy || (selected === "custom" && !isCustomValid(custom));

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const body: Record<string, unknown> = { framework: selected };
      if (selected === "custom") {
        body.needs_pct = Number(custom.needs);
        body.wants_pct = Number(custom.wants);
        body.savings_pct = Number(custom.savings);
      }
      await api("/api/settings", { method: "PUT", body });
      onSaved();
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card p-5">
      <div className="flex items-center gap-3 mb-4">
        <Icon name="pie_chart" fill size={24} className="text-amber" />
        <h3 className="text-lg font-bold flex-1">Active Strategy: {def.label}</h3>
        <button
          onClick={openModal}
          className="text-emerald-deep font-semibold text-sm active:opacity-70"
        >
          Change
        </button>
      </div>

      <StackedBar
        needs={settings.needs_pct}
        wants={settings.wants_pct}
        savings={settings.savings_pct}
      />

      <p className="mt-4 text-sm italic text-muted leading-relaxed">
        {FRAMEWORK_CAPTIONS[settings.framework]}
      </p>

      <Modal open={open} onClose={() => setOpen(false)} title="Budgeting framework">
        <FrameworkChooser
          selected={selected}
          custom={custom}
          onSelectFramework={setSelected}
          onCustomChange={setCustom}
        />
        {error && (
          <p className="mt-3 text-sm text-error bg-error-light rounded-lg px-3 py-2">{error}</p>
        )}
        <button
          onClick={save}
          disabled={saveDisabled}
          className="mt-4 w-full rounded-(--radius-field) bg-navy text-white py-3.5 font-semibold disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save strategy"}
        </button>
      </Modal>
    </div>
  );
}
