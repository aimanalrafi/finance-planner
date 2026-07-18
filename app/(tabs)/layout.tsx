"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { TabBar } from "@/components/TabBar";
import { MonthProvider, useMonth } from "@/components/MonthContext";
import { TourProvider } from "@/components/tour/TourContext";
import { HelpTour } from "@/components/tour/HelpTour";

function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { settings, loading } = useMonth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && settings && !settings.onboarded && pathname !== "/onboarding") {
      router.replace("/onboarding");
    }
  }, [loading, settings, pathname, router]);

  if (loading && !settings) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <div className="w-10 h-10 rounded-full border-[3px] border-lav border-t-navy animate-spin" />
        <p className="text-sm text-muted">Loading…</p>
      </div>
    );
  }
  return <>{children}</>;
}

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <MonthProvider>
      <TourProvider>
        <AppHeader />
        <main className="max-w-lg mx-auto px-5 pb-32 pt-4">
          <OnboardingGate>{children}</OnboardingGate>
        </main>
        <TabBar />
        <HelpTour />
      </TourProvider>
    </MonthProvider>
  );
}
