"use client";

import type { Bucket, OwnerTag, Settings } from "@/lib/types";

export interface BucketMeta {
  bucket: Bucket;
  name: string;
  subtitle: string;
  icon: string;
  /** dot / accent color as inline style hex */
  color: string;
  /** ProgressBar tone */
  tone: "navy" | "emerald" | "amber";
  accentClass: string; // vertical accent bar bg
  chipBg: string; // soft tinted bg
  chipText: string;
}

export const BUCKETS: BucketMeta[] = [
  {
    bucket: "needs",
    name: "Needs",
    subtitle: "Essential living expenses",
    icon: "home",
    color: "#0a1b3d",
    tone: "navy",
    accentClass: "bg-navy",
    chipBg: "bg-lav",
    chipText: "text-navy",
  },
  {
    bucket: "wants",
    name: "Wants",
    subtitle: "Lifestyle and leisure",
    icon: "local_mall",
    color: "#059669",
    tone: "emerald",
    accentClass: "bg-emerald",
    chipBg: "bg-mint",
    chipText: "text-emerald-deep",
  },
  {
    bucket: "savings",
    name: "Savings & Investments",
    subtitle: "Future growth and security",
    icon: "savings",
    color: "#d97706",
    tone: "amber",
    accentClass: "bg-amber",
    chipBg: "bg-cream",
    chipText: "text-amber",
  },
];

export function bucketMeta(b: Bucket): BucketMeta {
  return BUCKETS.find((x) => x.bucket === b) ?? BUCKETS[0];
}

/** Curated Material Symbols for category / instalment icon picking. */
export const CATEGORY_ICONS = [
  "home",
  "shopping_cart",
  "restaurant",
  "bolt",
  "directions_car",
  "local_hospital",
  "fitness_center",
  "school",
  "pets",
  "flight",
  "movie",
  "checkroom",
  "phone_iphone",
  "wifi",
  "savings",
  "trending_up",
  "credit_card",
  "subscriptions",
  "child_care",
  "spa",
  "sports_esports",
  "local_cafe",
  "receipt_long",
  "shield",
];

export function personName(settings: Settings | null, id: number): string {
  return settings?.persons.find((p) => p.id === id)?.name ?? `Person ${id}`;
}

export function ownerLabel(settings: Settings | null, tag: OwnerTag): string | null {
  if (!tag) return null;
  if (tag === "joint") return "Joint";
  if (tag === "p1") return personName(settings, 1);
  if (tag === "p2") return personName(settings, 2);
  return null;
}

export function OwnerPill({
  settings,
  tag,
}: {
  settings: Settings | null;
  tag: OwnerTag;
}) {
  const label = ownerLabel(settings, tag);
  if (!label) return null;
  return (
    <span className="inline-flex items-center rounded-full bg-chip px-2 py-0.5 text-[10px] font-semibold text-chip-ink">
      {label}
    </span>
  );
}

/** Owner-tag option list for selects, respecting person names. Solo mode → empty. */
export function ownerOptions(settings: Settings | null): { value: OwnerTag; label: string }[] {
  if (!settings || settings.mode !== "household") return [];
  return [
    { value: "joint", label: "Joint" },
    { value: "p1", label: personName(settings, 1) },
    { value: "p2", label: personName(settings, 2) },
  ];
}

/** Error text block used across planning modals/cards. */
export function ErrorText({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return (
    <div className="text-error bg-error-light rounded-lg px-3 py-2 text-sm mt-2">{msg}</div>
  );
}
