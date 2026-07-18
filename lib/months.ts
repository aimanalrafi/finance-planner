export const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export function isValidMonth(m: unknown): m is string {
  return typeof m === "string" && MONTH_RE.test(m);
}

export function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function addMonths(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const total = y * 12 + (m - 1) + delta;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return `${ny}-${String(nm).padStart(2, "0")}`;
}

export function monthDiff(a: string, b: string): number {
  // b - a in months
  const [ay, am] = a.split("-").map(Number);
  const [by, bm] = b.split("-").map(Number);
  return (by - ay) * 12 + (bm - am);
}

export function monthNumber(month: string): number {
  return Number(month.split("-")[1]);
}

export function yearOf(month: string): number {
  return Number(month.split("-")[0]);
}

const NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function monthName(month: string): string {
  return NAMES[monthNumber(month) - 1];
}

export function monthLabel(month: string): string {
  return `${monthName(month)} ${yearOf(month)}`;
}

export function shortMonthName(month: string): string {
  return NAMES[monthNumber(month) - 1].slice(0, 3);
}
