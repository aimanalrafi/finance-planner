"use client";

import { Icon } from "./Icon";

export function AppHeader({ title = "Personal Finance" }: { title?: string }) {
  return (
    <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur-md border-b border-line/60">
      <div className="max-w-lg mx-auto flex items-center gap-3 px-5 pt-[calc(env(safe-area-inset-top)+10px)] pb-2.5">
        <div className="w-9 h-9 rounded-full bg-navy flex items-center justify-center shrink-0">
          <Icon name="savings" fill size={20} className="text-mint-strong" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight flex-1">{title}</h1>
        <Icon name="notifications" size={24} className="text-ink" />
      </div>
    </header>
  );
}
