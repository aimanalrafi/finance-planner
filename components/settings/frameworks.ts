import type { Framework } from "@/lib/types";

export interface FrameworkDef {
  id: Framework;
  /** Short label shown in "Active Strategy: {label}" and card titles */
  label: string;
  desc: string;
  /** [needs, wants, savings] preset — null for custom (user-defined) */
  pcts: [number, number, number] | null;
  recommended?: boolean;
}

export const FRAMEWORKS: FrameworkDef[] = [
  {
    id: "50/30/20",
    label: "50/30/20",
    desc: "Balanced split across needs, wants and savings. A solid default for most households.",
    pcts: [50, 30, 20],
    recommended: true,
  },
  {
    id: "70/20/10",
    label: "70/20/10",
    desc: "A relaxed plan — more room for needs, with lighter wants and savings.",
    pcts: [70, 20, 10],
  },
  {
    id: "zero",
    label: "Zero-based",
    desc: "Give every euro a job until nothing is left unassigned each month.",
    pcts: [50, 30, 20],
  },
  {
    id: "pyf",
    label: "Pay yourself first",
    desc: "Savings come off the top, then you spend whatever remains.",
    pcts: [50, 30, 20],
  },
  {
    id: "custom",
    label: "Custom",
    desc: "Set your own needs, wants and savings percentages.",
    pcts: null,
  },
];

export function frameworkDef(id: Framework): FrameworkDef {
  return FRAMEWORKS.find((f) => f.id === id) ?? FRAMEWORKS[0];
}

/** Caption shown beneath the allocation bar on the settings framework card */
export const FRAMEWORK_CAPTIONS: Record<Framework, string> = {
  "50/30/20": "Automated allocation across your buckets based on the balanced standard for healthy finances.",
  "70/20/10": "A gentler allocation that leaves more headroom for everyday needs.",
  zero: "Every euro is assigned a role, so nothing drifts unplanned.",
  pyf: "Savings are secured first, then the rest of your money is put to work.",
  custom: "A bespoke allocation tuned to how your household actually spends.",
};

/** ~24 curated Material Symbols for category icons */
export const CATEGORY_ICONS = [
  "home",
  "restaurant",
  "shopping_cart",
  "directions_car",
  "bolt",
  "water_drop",
  "wifi",
  "local_hospital",
  "medication",
  "school",
  "fitness_center",
  "checkroom",
  "local_cafe",
  "sports_esports",
  "movie",
  "flight",
  "pets",
  "child_care",
  "savings",
  "trending_up",
  "account_balance",
  "credit_card",
  "phone_iphone",
  "subscriptions",
  "celebration",
  "redeem",
  "spa",
  "directions_bus",
];

/** Investment types offered when a savings category is marked as investing */
export const INVEST_TYPES = ["Stocks", "ETF", "Crypto", "Pension", "Bonds", "Real estate"];
