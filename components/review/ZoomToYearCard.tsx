"use client";

import { Icon } from "@/components/Icon";

export function ZoomToYearCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group w-full bg-navy-deep text-white rounded-(--radius-card) p-5 flex items-center gap-4 text-left shadow-lift active:scale-[0.99] transition"
    >
      <div className="w-11 h-11 shrink-0 rounded-full bg-mint-strong/20 flex items-center justify-center group-hover:bg-mint-strong/30 transition-colors">
        <Icon name="zoom_in" size={24} className="text-mint-strong" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-semibold">Zoom to Year View</h3>
        <p className="text-sm text-white/70">Analyze 12-month performance & patterns</p>
      </div>
      <Icon
        name="arrow_forward"
        size={22}
        className="text-mint-strong group-hover:translate-x-1 transition-transform"
      />
    </button>
  );
}
