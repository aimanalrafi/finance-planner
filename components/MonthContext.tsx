"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { currentMonth } from "@/lib/months";
import { api, setCurrency } from "@/lib/client";
import type { MonthBundle, Settings } from "@/lib/types";

interface MonthCtx {
  month: string;
  setMonth: (m: string) => void;
  bundle: MonthBundle | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  settings: Settings | null;
}

const Ctx = createContext<MonthCtx | null>(null);

export function MonthProvider({ children }: { children: React.ReactNode }) {
  const [month, setMonth] = useState(currentMonth());
  const [bundle, setBundle] = useState<MonthBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api<MonthBundle>(`/api/month/${month}`)
      .then((b) => {
        if (!cancelled) {
          setBundle(b);
          setCurrency(b.settings.currency);
          setError(null);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [month, tick]);

  return (
    <Ctx.Provider
      value={{
        month,
        setMonth,
        bundle,
        loading,
        error,
        refresh,
        settings: bundle?.settings ?? null,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useMonth(): MonthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useMonth must be used within MonthProvider");
  return ctx;
}
