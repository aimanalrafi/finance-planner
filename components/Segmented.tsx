"use client";

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex rounded-full bg-lav p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-full py-2 text-sm font-semibold transition-all ${
            value === o.value ? "bg-white shadow-sm text-ink" : "text-muted"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
