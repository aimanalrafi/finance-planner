"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { useMonth } from "@/components/MonthContext";
import { useTour } from "./TourContext";

/* ---------- animated mini-mockups (pure CSS, replay on slide change) ---------- */

function Stage({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-52 rounded-2xl bg-lav/60 border border-line flex flex-col items-center justify-center gap-3 px-6 overflow-hidden">
      {children}
    </div>
  );
}

function BucketsVisual({ needs, wants, savings }: { needs: number; wants: number; savings: number }) {
  return (
    <Stage>
      <div className="w-full max-w-60 h-8 rounded-full overflow-hidden flex tour-grow-x">
        <div className="bg-navy flex items-center justify-center text-white text-[10px] font-bold" style={{ width: `${needs}%` }}>
          {needs}%
        </div>
        <div className="bg-emerald flex items-center justify-center text-white text-[10px] font-bold" style={{ width: `${wants}%` }}>
          {wants}%
        </div>
        <div className="bg-amber-soft flex items-center justify-center text-navy-deep text-[10px] font-bold" style={{ width: `${savings}%` }}>
          {savings}%
        </div>
      </div>
      <div className="flex gap-2">
        {[
          ["home", "Needs", "bg-navy text-white"],
          ["storefront", "Wants", "bg-emerald text-white"],
          ["savings", "Savings", "bg-amber-soft text-navy-deep"],
        ].map(([icon, label, cls], i) => (
          <div
            key={label}
            className={`tour-pop flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${cls}`}
            style={{ animationDelay: `${0.5 + i * 0.18}s` }}
          >
            <Icon name={icon} size={14} /> {label}
          </div>
        ))}
      </div>
      <p className="label-caps text-faint tour-fade" style={{ animationDelay: "1.2s" }}>
        Live percentages, always visible
      </p>
    </Stage>
  );
}

function PlanningVisual() {
  return (
    <Stage>
      <div className="w-full max-w-64 card p-3 flex items-center gap-2.5 tour-pop">
        <span className="w-8 h-8 rounded-lg bg-lav flex items-center justify-center">
          <Icon name="shopping_cart" size={16} className="text-navy" />
        </span>
        <span className="text-sm font-semibold flex-1">Groceries</span>
        <span className="data-mono text-sm">550 €</span>
      </div>
      <div className="w-full max-w-64 card p-3 tour-pop" style={{ animationDelay: "0.25s" }}>
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-mint flex items-center justify-center">
            <Icon name="flight" size={16} className="text-emerald-deep" />
          </span>
          <span className="text-sm font-semibold flex-1">Tokyo Flights</span>
          <span className="text-[10px] font-bold bg-chip text-chip-ink rounded-full px-2 py-0.5">Split 4</span>
        </div>
        <div className="flex items-center gap-2 mt-2 pl-10">
          <span className="flex gap-1">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={`w-2 h-2 rounded-full tour-pop ${i < 2 ? "bg-navy" : "bg-line"}`}
                style={{ animationDelay: `${0.6 + i * 0.15}s` }}
              />
            ))}
          </span>
          <span className="data-mono text-xs text-muted">340 €/mo auto</span>
        </div>
      </div>
      <div className="w-full max-w-64 dashed-card px-3 py-2 flex items-center gap-2 tour-fade" style={{ animationDelay: "1s" }}>
        <Icon name="pending" size={15} className="text-amber" />
        <span className="text-xs text-muted flex-1">Concert Tickets · tentative</span>
        <span className="data-mono text-xs">85 €</span>
      </div>
    </Stage>
  );
}

function SurpriseVisual() {
  return (
    <Stage>
      <div className="w-full max-w-64">
        <div className="flex justify-between text-[10px] label-caps text-faint mb-1.5">
          <span>Needs bucket</span>
          <span>impact</span>
        </div>
        <div className="w-full h-6 rounded-full bg-white border border-line overflow-hidden flex">
          <div className="tour-fill-1 bg-navy h-full rounded-l-full" />
          <div className="tour-fill-2 h-full bg-amber-bright" />
          <div className="tour-fill-3 h-full tour-stripes" />
        </div>
        <div className="flex justify-between data-mono text-[11px] text-muted mt-1.5">
          <span>1.708 €</span>
          <span className="text-error font-semibold">+185 € surprise</span>
        </div>
      </div>
      <div className="w-full max-w-64 card px-3 py-2.5 flex items-center gap-2 tour-pop" style={{ animationDelay: "1.5s" }}>
        <span className="w-5 h-5 rounded-md bg-emerald flex items-center justify-center">
          <Icon name="check" size={14} className="text-white" />
        </span>
        <span className="text-xs flex-1">
          Take <b className="data-mono">150 €</b> from <b>Emergency Buffer</b>
        </span>
      </div>
      <p className="label-caps text-faint tour-fade" style={{ animationDelay: "2s" }}>
        You decide — the plan updates itself
      </p>
    </Stage>
  );
}

function ReviewVisual() {
  const bars = [62, 78, 55, 90, 70, 84];
  return (
    <Stage>
      <div className="flex items-end gap-2 h-24">
        {bars.map((h, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div
              className={`w-6 rounded-t-md tour-grow-y ${i === 3 ? "bg-error/80" : "bg-emerald"}`}
              style={{ height: `${h}%`, animationDelay: `${i * 0.12}s` }}
            />
            <span className="text-[9px] font-bold text-faint">{["J", "F", "M", "A", "M", "J"][i]}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <span className="tour-pop text-[10px] font-bold bg-mint text-emerald-deep rounded-full px-2.5 py-1" style={{ animationDelay: "0.9s" }}>
          −190 € UNDER
        </span>
        <span className="tour-pop text-[10px] font-bold bg-cream text-amber rounded-full px-2.5 py-1" style={{ animationDelay: "1.05s" }}>
          1 SURPRISE
        </span>
        <span className="tour-pop text-[10px] font-bold bg-chip text-chip-ink rounded-full px-2.5 py-1" style={{ animationDelay: "1.2s" }}>
          ✓ CLOSED
        </span>
      </div>
    </Stage>
  );
}

function ReadyVisual() {
  const tabs = [
    ["home", "Home", "Track this month live"],
    ["calendar_month", "Planning", "The monthly sit-down"],
    ["analytics", "Review", "History & year view"],
    ["settings", "Settings", "Framework & categories"],
  ];
  return (
    <Stage>
      <div className="w-full max-w-64 flex flex-col gap-2">
        {tabs.map(([icon, name, desc], i) => (
          <div key={name} className="tour-pop flex items-center gap-3 bg-white rounded-xl border border-line px-3 py-2" style={{ animationDelay: `${i * 0.15}s` }}>
            <span className="w-8 h-8 rounded-full bg-mint flex items-center justify-center">
              <Icon name={icon} size={16} className="text-emerald-deep" />
            </span>
            <span className="text-sm font-bold">{name}</span>
            <span className="text-xs text-muted ml-auto">{desc}</span>
          </div>
        ))}
      </div>
    </Stage>
  );
}

/* ---------- the wizard ---------- */

export function HelpTour() {
  const { open, closeTour } = useTour();
  const { settings } = useMonth();
  const router = useRouter();
  const [step, setStep] = useState(0);

  if (!open) return null;

  const pcts = settings
    ? { needs: Math.round(settings.needs_pct), wants: Math.round(settings.wants_pct), savings: Math.round(settings.savings_pct) }
    : { needs: 50, wants: 30, savings: 20 };

  const slides = [
    {
      visual: <BucketsVisual {...pcts} />,
      title: "Every euro has a bucket",
      body: `Your money flows into Needs, Wants and Savings — the ${settings?.framework ?? "50/30/20"} framework you picked. The app shows live percentages so you always know where you stand.`,
    },
    {
      visual: <PlanningVisual />,
      title: "Plan a month in minutes",
      body: "Set budgets per category in the Planning tab. Big purchases split into monthly instalments automatically, yearly bills land in the right months, and unsure expenses stay “tentative” until you commit.",
    },
    {
      visual: <SurpriseVisual />,
      title: "Surprises don’t break the plan",
      body: "Something came up? Log it from Home and see exactly how it hits your budget — then accept a suggestion for where the money comes from. One tap, plan rebalanced.",
    },
    {
      visual: <ReviewVisual />,
      title: "Zoom out anytime",
      body: "The Review tab keeps your whole history: planned vs actual for any month, a full-year view, and a month close-out that turns leftover budget into savings.",
    },
    {
      visual: <ReadyVisual />,
      title: "You’re ready",
      body: "That’s the whole system — four tabs, one calm overview of your money.",
    },
  ];
  const last = step === slides.length - 1;

  function finish(trySurprise: boolean) {
    setStep(0);
    closeTour();
    if (trySurprise) router.push("/?surprise=1");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <style>{`
        @keyframes tourGrowX { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        @keyframes tourGrowY { from { transform: scaleY(0); } to { transform: scaleY(1); } }
        @keyframes tourPop { 0% { opacity: 0; transform: scale(0.85) translateY(6px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes tourFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes tourFill1 { from { width: 0; } to { width: 58%; } }
        @keyframes tourFill2 { 0%, 55% { width: 0; } 100% { width: 30%; } }
        @keyframes tourFill3 { 0%, 75% { width: 0; } 100% { width: 12%; } }
        .tour-grow-x { transform-origin: left; animation: tourGrowX 0.7s cubic-bezier(0.2,0.8,0.2,1) both; }
        .tour-grow-y { transform-origin: bottom; animation: tourGrowY 0.6s cubic-bezier(0.2,0.8,0.2,1) both; }
        .tour-pop { animation: tourPop 0.45s cubic-bezier(0.2,0.8,0.2,1) both; }
        .tour-fade { animation: tourFade 0.6s ease both; }
        .tour-fill-1 { animation: tourFill1 0.9s ease-out both; }
        .tour-fill-2 { animation: tourFill2 1.6s ease-out both; }
        .tour-fill-3 { animation: tourFill3 2s ease-out both; }
        .tour-stripes { background: repeating-linear-gradient(135deg, #f59e0b 0 6px, #fde68a 6px 12px); }
      `}</style>
      <div className="absolute inset-0 glass-backdrop" onClick={() => finish(false)} />
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl animate-slide-up pb-[max(env(safe-area-inset-bottom),16px)]">
        <div className="flex items-center justify-between px-5 pt-4">
          <div className="flex gap-1.5">
            {slides.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? "w-6 bg-navy" : "w-1.5 bg-line"}`}
              />
            ))}
          </div>
          <button onClick={() => finish(false)} className="text-sm font-semibold text-faint px-2 py-1">
            Skip
          </button>
        </div>

        <div className="px-5 pt-4" key={step}>
          {slides[step].visual}
          <h2 className="text-2xl font-bold tracking-tight mt-5">{slides[step].title}</h2>
          <p className="text-[15px] leading-relaxed text-muted mt-2 min-h-20">{slides[step].body}</p>
        </div>

        <div className="px-5 pt-2 flex flex-col gap-2.5">
          {last ? (
            <>
              <button
                onClick={() => finish(true)}
                className="w-full rounded-(--radius-field) bg-emerald text-white font-semibold py-3.5 active:scale-[0.99] transition flex items-center justify-center gap-2"
              >
                <Icon name="swap_horiz" size={20} /> Try the surprise flow
              </button>
              <button
                onClick={() => finish(false)}
                className="w-full rounded-(--radius-field) bg-navy text-white font-semibold py-3.5 active:scale-[0.99] transition"
              >
                Start exploring
              </button>
            </>
          ) : (
            <div className="flex gap-2.5">
              {step > 0 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="rounded-(--radius-field) border border-line text-ink font-semibold py-3.5 px-5 active:scale-[0.99] transition"
                >
                  Back
                </button>
              )}
              <button
                onClick={() => setStep(step + 1)}
                className="flex-1 rounded-(--radius-field) bg-navy text-white font-semibold py-3.5 active:scale-[0.99] transition"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
