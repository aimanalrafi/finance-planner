"use client";

import Link from "next/link";
import { Icon } from "@/components/Icon";

export function EmptyState() {
  return (
    <div className="dashed-card p-8 flex flex-col items-center text-center">
      <div className="w-14 h-14 rounded-full bg-lav flex items-center justify-center mb-4">
        <Icon name="calendar_month" fill size={28} className="text-navy" />
      </div>
      <h3 className="text-xl font-semibold mb-1">Let&apos;s build your plan</h3>
      <p className="text-sm text-muted max-w-xs mb-5">
        Add your income and plan your buckets to start tracking your monthly harmony.
      </p>
      <Link
        href="/planning"
        className="rounded-(--radius-field) bg-navy text-white font-semibold px-5 py-3 active:scale-[0.99] transition"
      >
        Go to Planning
      </Link>
    </div>
  );
}
