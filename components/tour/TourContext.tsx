"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { api } from "@/lib/client";
import { useMonth } from "@/components/MonthContext";

interface TourCtx {
  open: boolean;
  openTour: () => void;
  closeTour: () => void;
}

const Ctx = createContext<TourCtx | null>(null);

export function TourProvider({ children }: { children: React.ReactNode }) {
  const { settings, refresh } = useMonth();
  const [open, setOpen] = useState(false);
  const autoShown = useRef(false);

  // auto-launch exactly once, the first time the app loads after onboarding
  useEffect(() => {
    if (!autoShown.current && settings?.onboarded && !settings.tour_seen) {
      autoShown.current = true;
      setOpen(true);
    }
  }, [settings]);

  function closeTour() {
    setOpen(false);
    if (settings && !settings.tour_seen) {
      api("/api/settings", { method: "PUT", body: { tour_seen: true } })
        .then(() => refresh())
        .catch(() => {});
    }
  }

  return (
    <Ctx.Provider value={{ open, openTour: () => setOpen(true), closeTour }}>
      {children}
    </Ctx.Provider>
  );
}

export function useTour(): TourCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTour must be used within TourProvider");
  return ctx;
}
