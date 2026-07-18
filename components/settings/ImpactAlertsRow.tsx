"use client";

import { useState } from "react";
import { api } from "@/lib/client";
import { Icon } from "@/components/Icon";
import type { Settings } from "@/lib/types";

export function ImpactAlertsRow({
  settings,
  onSaved,
}: {
  settings: Settings;
  onSaved: () => void;
}) {
  const on = settings.surprise_alert_pct > 0;
  const [busy, setBusy] = useState(false);

  async function put(pct: number) {
    setBusy(true);
    try {
      await api("/api/settings", { method: "PUT", body: { surprise_alert_pct: pct } });
      onSaved();
    } catch {
      /* silent — a failed toggle simply leaves the prior value visible */
    } finally {
      setBusy(false);
    }
  }

  function toggle() {
    if (busy) return;
    put(on ? 0 : 5);
  }

  function step(delta: number) {
    if (busy) return;
    const next = Math.min(50, Math.max(1, settings.surprise_alert_pct + delta));
    if (next !== settings.surprise_alert_pct) put(next);
  }

  return (
    <div className="p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <Icon name="warning" size={22} className="text-amber mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold">Impact Alerts</p>
          <p className="text-sm text-muted">
            Notify when a &lsquo;Surprise&rsquo; exceeds {on ? settings.surprise_alert_pct : 5}% of
            monthly budget
          </p>
        </div>
        <button
          role="switch"
          aria-checked={on}
          aria-label="Toggle impact alerts"
          onClick={toggle}
          disabled={busy}
          className={`relative w-12 h-7 rounded-full shrink-0 transition-colors ${
            on ? "bg-emerald" : "bg-lav"
          } disabled:opacity-60`}
        >
          <span
            className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
              on ? "translate-x-5" : ""
            }`}
          />
        </button>
      </div>

      {on && (
        <div className="flex items-center gap-3 pl-8">
          <span className="label-caps text-faint">Threshold</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => step(-1)}
              disabled={busy || settings.surprise_alert_pct <= 1}
              className="w-8 h-8 rounded-full bg-slate-surface border border-line flex items-center justify-center text-muted disabled:opacity-40"
              aria-label="Decrease threshold"
            >
              <Icon name="remove" size={18} />
            </button>
            <span className="data-mono font-semibold w-12 text-center">
              {settings.surprise_alert_pct}%
            </span>
            <button
              onClick={() => step(1)}
              disabled={busy || settings.surprise_alert_pct >= 50}
              className="w-8 h-8 rounded-full bg-slate-surface border border-line flex items-center justify-center text-muted disabled:opacity-40"
              aria-label="Increase threshold"
            >
              <Icon name="add" size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
