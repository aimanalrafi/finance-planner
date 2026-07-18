"use client";

import { useState } from "react";
import { api } from "@/lib/client";
import { Icon } from "@/components/Icon";
import { Segmented } from "@/components/Segmented";
import type { Settings } from "@/lib/types";

export function AccountIdentityCard({
  settings,
  onSaved,
}: {
  settings: Settings;
  onSaved: () => void;
}) {
  const p1 = settings.persons.find((p) => p.id === 1);
  const p2 = settings.persons.find((p) => p.id === 2);

  const [editing, setEditing] = useState(false);
  const [name1, setName1] = useState(p1?.name ?? "");
  const [name2, setName2] = useState(p2?.name ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // inline prompt when switching to household without a second person
  const [needP2, setNeedP2] = useState(false);
  const [newP2, setNewP2] = useState("");

  async function saveNames() {
    if (!name1.trim()) {
      setError("Primary name is required");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const persons = [{ id: 1, name: name1.trim() }];
      if (settings.mode === "household") persons.push({ id: 2, name: name2.trim() || "Partner" });
      await api("/api/settings", { method: "PUT", body: { persons } });
      onSaved();
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  async function changeMode(mode: "solo" | "household") {
    if (mode === settings.mode) return;
    if (mode === "household" && !p2?.name) {
      setNeedP2(true);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api("/api/settings", { method: "PUT", body: { mode } });
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not switch");
    } finally {
      setBusy(false);
    }
  }

  async function confirmHousehold() {
    if (!newP2.trim()) {
      setError("Enter a name for the second person");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api("/api/settings", {
        method: "PUT",
        body: { mode: "household", persons: [{ id: 2, name: newP2.trim() }] },
      });
      onSaved();
      setNeedP2(false);
      setNewP2("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not switch");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card overflow-hidden">
      {/* Identity row */}
      {editing ? (
        <div className="p-5 flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="label-caps text-faint">Primary name</span>
            <input
              value={name1}
              onChange={(e) => setName1(e.target.value)}
              autoFocus
              className="rounded-(--radius-field) border border-line bg-slate-surface px-4 py-3 outline-none focus:border-navy focus:ring-2 focus:ring-chip"
              placeholder="Your name"
            />
          </label>
          {settings.mode === "household" && (
            <label className="flex flex-col gap-1.5">
              <span className="label-caps text-faint">Second person</span>
              <input
                value={name2}
                onChange={(e) => setName2(e.target.value)}
                className="rounded-(--radius-field) border border-line bg-slate-surface px-4 py-3 outline-none focus:border-navy focus:ring-2 focus:ring-chip"
                placeholder="Partner's name"
              />
            </label>
          )}
          {error && (
            <p className="text-sm text-error bg-error-light rounded-lg px-3 py-2">{error}</p>
          )}
          <div className="flex gap-2 mt-1">
            <button
              onClick={() => {
                setEditing(false);
                setName1(p1?.name ?? "");
                setName2(p2?.name ?? "");
                setError(null);
              }}
              className="flex-1 rounded-(--radius-field) border border-line py-2.5 font-semibold text-muted"
            >
              Cancel
            </button>
            <button
              onClick={saveNames}
              disabled={busy}
              className="flex-1 rounded-(--radius-field) bg-navy text-white py-2.5 font-semibold disabled:opacity-60"
            >
              {busy ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="w-full p-5 flex items-center gap-4 text-left"
        >
          <div className="w-14 h-14 rounded-2xl bg-navy flex items-center justify-center shrink-0">
            <Icon name="person" fill size={26} className="text-mint-strong" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xl font-bold truncate">{p1?.name || "Set your name"}</p>
            <p className="text-sm text-muted">Primary account</p>
          </div>
          <Icon name="chevron_right" size={24} className="text-faint" />
        </button>
      )}

      <div className="border-t border-line" />

      {/* Household management */}
      <div className="p-5">
        <div className="flex items-center gap-3">
          <Icon name="group" fill size={24} className="text-emerald" />
          <span className="font-semibold flex-1">Household Management</span>
          <div className="w-40">
            <Segmented
              options={[
                { value: "solo", label: "Solo" },
                { value: "household", label: "Household" },
              ]}
              value={settings.mode}
              onChange={(v) => changeMode(v)}
            />
          </div>
        </div>

        {needP2 && (
          <div className="mt-4 rounded-(--radius-card) border border-line bg-slate-surface p-4 animate-slide-up">
            <p className="text-sm font-semibold mb-2">Who are you sharing with?</p>
            <input
              value={newP2}
              onChange={(e) => setNewP2(e.target.value)}
              autoFocus
              className="w-full rounded-(--radius-field) border border-line bg-white px-4 py-3 outline-none focus:border-navy focus:ring-2 focus:ring-chip"
              placeholder="Partner's name"
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => {
                  setNeedP2(false);
                  setNewP2("");
                  setError(null);
                }}
                className="flex-1 rounded-(--radius-field) border border-line py-2.5 font-semibold text-muted"
              >
                Cancel
              </button>
              <button
                onClick={confirmHousehold}
                disabled={busy}
                className="flex-1 rounded-(--radius-field) bg-navy text-white py-2.5 font-semibold disabled:opacity-60"
              >
                {busy ? "Saving…" : "Add"}
              </button>
            </div>
          </div>
        )}

        {error && !editing && !needP2 && (
          <p className="mt-3 text-sm text-error bg-error-light rounded-lg px-3 py-2">{error}</p>
        )}
      </div>
    </div>
  );
}
