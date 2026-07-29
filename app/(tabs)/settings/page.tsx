"use client";

import { useState } from "react";
import { useMonth } from "@/components/MonthContext";
import { Icon } from "@/components/Icon";
import { AccountIdentityCard } from "@/components/settings/AccountIdentityCard";
import { FrameworkCard } from "@/components/settings/FrameworkCard";
import { CategoryManager } from "@/components/settings/CategoryManager";
import { ImpactAlertsRow } from "@/components/settings/ImpactAlertsRow";
import { CurrencyRow } from "@/components/settings/CurrencyRow";
import { useTour } from "@/components/tour/TourContext";

export default function SettingsPage() {
  const { settings, refresh, loading } = useMonth();
  const { openTour } = useTour();
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* proceed to login regardless */
    }
    window.location.href = "/login";
  }

  if (!settings) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-9 h-9 rounded-full border-[3px] border-lav border-t-navy animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-7 pb-6">
      <section className="flex flex-col gap-2.5">
        <p className="label-caps text-faint px-1">Account Identity</p>
        <AccountIdentityCard settings={settings} onSaved={refresh} />
      </section>

      <section className="flex flex-col gap-2.5">
        <p className="label-caps text-faint px-1">Budgeting Framework</p>
        <FrameworkCard settings={settings} onSaved={refresh} />
      </section>

      <section className="flex flex-col gap-2.5">
        <p className="label-caps text-faint px-1">Configuration</p>
        <div className="card overflow-hidden divide-y divide-line">
          <CategoryManager settings={settings} />
          <ImpactAlertsRow settings={settings} onSaved={refresh} />
          <CurrencyRow settings={settings} onSaved={refresh} />
          <button
            onClick={openTour}
            className="w-full p-4 flex items-center gap-3 text-left active:bg-slate-surface transition"
          >
            <Icon name="help" size={22} className="text-muted" />
            <span className="font-semibold flex-1">App Tour</span>
            <span className="text-xs text-faint">Replay the intro</span>
            <Icon name="chevron_right" size={20} className="text-faint" />
          </button>
        </div>
      </section>

      <button
        onClick={signOut}
        disabled={signingOut}
        className="card p-4 flex items-center gap-3 text-error font-semibold active:scale-[0.99] transition disabled:opacity-60"
      >
        <Icon name="logout" size={22} />
        {signingOut ? "Signing out…" : "Sign Out"}
      </button>

      <p className="text-center text-xs text-faint">Fiscal Harmony • v1.0</p>

      {loading && <p className="text-center text-xs text-faint -mt-4">Syncing…</p>}
    </div>
  );
}
