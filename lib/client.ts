"use client";

export async function api<T = unknown>(
  path: string,
  opts?: { method?: string; body?: unknown }
): Promise<T> {
  const res = await fetch(path, {
    method: opts?.method || "GET",
    headers: opts?.body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: opts?.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  if (res.status === 401) {
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  }
  return data as T;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: "€",
  USD: "$",
  GBP: "£",
  MYR: "RM",
  SGD: "S$",
  JPY: "¥",
  AUD: "A$",
  CAD: "C$",
  INR: "₹",
};

let currentCurrency = "EUR";

export function setCurrency(code: string) {
  currentCurrency = code;
}

export function currencySymbol(): string {
  return CURRENCY_SYMBOLS[currentCurrency] ?? currentCurrency;
}

export function euro(n: number, opts?: { sign?: boolean; decimals?: number }): string {
  const decimals = opts?.decimals ?? 2;
  const sign = opts?.sign && n > 0 ? "+" : "";
  const number = new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
  return `${sign}${number} ${currencySymbol()}`;
}

export function pct(n: number): string {
  return `${Math.round(n)}%`;
}
