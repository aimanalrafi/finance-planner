"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error || "Login failed");
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setError("Network error — try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-6 bg-surface">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-navy flex items-center justify-center mb-4 shadow-lg">
            <span className="material-symbols-outlined msf text-mint-strong" style={{ fontSize: 32 }}>
              savings
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Personal Finance</h1>
          <p className="text-sm text-muted mt-1">Your household&apos;s fiscal harmony</p>
        </div>

        <form onSubmit={submit} className="card p-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="label-caps text-faint">Email</span>
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-(--radius-field) border border-line bg-slate-surface px-4 py-3 text-base outline-none focus:border-navy focus:ring-2 focus:ring-chip"
              placeholder="you@example.com"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="label-caps text-faint">Password</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-(--radius-field) border border-line bg-slate-surface px-4 py-3 text-base outline-none focus:border-navy focus:ring-2 focus:ring-chip"
              placeholder="••••••••"
            />
          </label>
          {error && (
            <p className="text-sm text-error bg-error-light rounded-lg px-3 py-2">{error}</p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="mt-2 rounded-(--radius-field) bg-navy text-white font-semibold py-3.5 active:scale-[0.99] transition disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </main>
  );
}
