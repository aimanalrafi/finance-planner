"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";

const TABS = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/planning", label: "Planning", icon: "calendar_month" },
  { href: "/review", label: "Review", icon: "analytics" },
  { href: "/settings", label: "Settings", icon: "settings" },
];

export function TabBar() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/90 backdrop-blur-md border-t border-line pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-lg mx-auto grid grid-cols-4 px-2 py-1.5">
        {TABS.map((t) => {
          const active = t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className="flex flex-col items-center gap-0.5 py-1"
            >
              <span
                className={`px-4 py-1 rounded-full transition-colors ${
                  active ? "bg-mint text-emerald-deep" : "text-muted"
                }`}
              >
                <Icon name={t.icon} fill={active} size={22} />
              </span>
              <span
                className={`text-[11px] font-semibold ${
                  active ? "text-emerald-deep" : "text-muted"
                }`}
              >
                {t.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
