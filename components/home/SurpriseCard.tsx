"use client";

import { Icon } from "@/components/Icon";

export function SurpriseCard({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="group w-full bg-navy-deep text-white rounded-(--radius-card) p-6 flex flex-col items-start text-left shadow-lift active:scale-[0.99] transition"
    >
      <div className="w-12 h-12 rounded-full bg-mint-strong/20 flex items-center justify-center mb-4 group-hover:bg-mint-strong/30 transition-colors">
        <Icon name="swap_horiz" size={28} className="text-mint-strong" />
      </div>
      <h3 className="text-xl font-semibold mb-1">Something came up?</h3>
      <p className="text-sm text-white/70">
        Log a surprise expense and see how it impacts your monthly harmony in seconds.
      </p>
      <div className="mt-5 w-full flex items-center justify-between">
        <span className="label-caps font-bold text-mint-strong">Adjust Plan</span>
        <Icon
          name="arrow_forward"
          size={22}
          className="text-mint-strong group-hover:translate-x-1 transition-transform"
        />
      </div>
    </button>
  );
}
