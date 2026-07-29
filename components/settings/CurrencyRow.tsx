"use client";

import { useState } from "react";
import { api } from "@/lib/client";
import { Icon } from "@/components/Icon";
import type { CurrencyCode, Settings } from "@/lib/types";

const OPTIONS: { code: CurrencyCode; label: string }[] = [
  { code: "EUR", label: "€ Euro" },
  { code: "USD", label: "$ US Dollar" },
  { code: "GBP", label: "£ British Pound" },
  { code: "MYR", label: "RM Malaysian Ringgit" },
  { code: "SGD", label: "S$ Singapore Dollar" },
  { code: "JPY", label: "¥ Japanese Yen" },
  { code: "AUD", label: "A$ Australian Dollar" },
  { code: "CAD", label: "C$ Canadian Dollar" },
  { code: "INR", label: "₹ Indian Rupee" },
];

export function CurrencyRow({
  settings,
  onSaved,
}: {
  settings: Settings;
  onSaved: () => void;
}) {
  const [busy, setBusy] = useState(false);

  async function change(currency: string) {
    if (currency === settings.currency) return;
    setBusy(true);
    try {
      await api("/api/settings", { method: "PUT", body: { currency } });
      onSaved();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-4 flex items-center gap-3">
      <Icon name="payments" size={22} className="text-muted" />
      <span className="font-semibold flex-1">Currency</span>
      <select
        value={settings.currency}
        onChange={(e) => change(e.target.value)}
        disabled={busy}
        className="rounded-(--radius-field) border border-line bg-white px-3 py-2 text-sm outline-none focus:border-navy disabled:opacity-60"
      >
        {OPTIONS.map((o) => (
          <option key={o.code} value={o.code}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
