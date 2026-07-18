"use client";

import { Icon } from "@/components/Icon";
import { CATEGORY_ICONS } from "./shared";

export function IconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {CATEGORY_ICONS.map((ic) => {
        const active = ic === value;
        return (
          <button
            key={ic}
            type="button"
            onClick={() => onChange(ic)}
            className={`aspect-square rounded-xl flex items-center justify-center border transition active:scale-95 ${
              active
                ? "bg-navy border-navy text-mint-strong"
                : "bg-slate-surface border-line text-muted"
            }`}
            aria-label={ic}
            aria-pressed={active}
          >
            <Icon name={ic} fill={active} size={22} />
          </button>
        );
      })}
    </div>
  );
}
