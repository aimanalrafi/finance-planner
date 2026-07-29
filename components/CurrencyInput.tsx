"use client";

import { currencySymbol } from "@/lib/client";

export function CurrencyInput({
  value,
  onChange,
  placeholder = "0.00",
  amber = false,
  autoFocus = false,
  large = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  amber?: boolean;
  autoFocus?: boolean;
  large?: boolean;
}) {
  return (
    <div className="relative">
      <input
        type="text"
        inputMode="decimal"
        autoFocus={autoFocus}
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          const v = e.target.value.replace(",", ".");
          if (/^\d*\.?\d{0,2}$/.test(v) || v === "") onChange(v);
        }}
        className={`w-full rounded-(--radius-field) border bg-white data-mono outline-none transition
          ${large ? "text-3xl text-center py-4 pr-12 pl-4 font-semibold" : "text-base py-3 pr-10 pl-4"}
          ${
            amber
              ? "border-amber-soft focus:ring-2 focus:ring-amber-soft/50 focus:border-amber"
              : "border-line focus:ring-2 focus:ring-chip focus:border-navy"
          }`}
      />
      <span
        className={`absolute top-1/2 -translate-y-1/2 text-faint data-mono ${
          large ? "right-5 text-2xl" : "right-4 text-base"
        }`}
      >
        {currencySymbol()}
      </span>
    </div>
  );
}
