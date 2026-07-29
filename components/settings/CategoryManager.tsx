"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client";
import { Icon } from "@/components/Icon";
import { Modal } from "@/components/Modal";
import type { Bucket, Category, OwnerTag, Settings } from "@/lib/types";
import { CATEGORY_ICONS, INVEST_TYPES } from "./frameworks";

const BUCKETS: { id: Bucket; label: string; icon: string; tone: string }[] = [
  { id: "needs", label: "Needs", icon: "foundation", tone: "text-navy" },
  { id: "wants", label: "Wants", icon: "storefront", tone: "text-emerald" },
  { id: "savings", label: "Savings", icon: "savings", tone: "text-amber" },
];

function ownerLabel(tag: OwnerTag, settings: Settings): string | null {
  if (!tag) return null;
  if (tag === "joint") return "Joint";
  const id = tag === "p1" ? 1 : 2;
  return settings.persons.find((p) => p.id === id)?.name ?? (tag === "p1" ? "Person 1" : "Person 2");
}

function EditForm({
  cat,
  settings,
  onCancel,
  onSaved,
}: {
  cat: Category;
  settings: Settings;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(cat.name);
  const [icon, setIcon] = useState(cat.icon);
  const [bucket, setBucket] = useState<Bucket>(cat.bucket);
  const [owner, setOwner] = useState<OwnerTag>(cat.owner_tag);
  const [invest, setInvest] = useState<string | null>(cat.invest_type);
  const [autoPaid, setAutoPaid] = useState(cat.auto_paid);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const household = settings.mode === "household";

  async function save() {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api(`/api/categories/${cat.id}`, {
        method: "PUT",
        body: {
          name: name.trim(),
          icon,
          bucket,
          owner_tag: household ? owner : null,
          invest_type: bucket === "savings" ? invest : null,
          auto_paid: bucket === "needs" ? autoPaid : false,
        },
      });
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
      setBusy(false);
    }
  }

  return (
    <div className="rounded-(--radius-card) border border-navy/30 bg-slate-surface p-4 flex flex-col gap-4 animate-slide-up">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
        className="rounded-(--radius-field) border border-line bg-white px-4 py-2.5 outline-none focus:border-navy focus:ring-2 focus:ring-chip"
        placeholder="Category name"
      />

      <div>
        <p className="label-caps text-faint mb-2">Icon</p>
        <div className="grid grid-cols-8 gap-1.5">
          {CATEGORY_ICONS.map((ic) => (
            <button
              key={ic}
              onClick={() => setIcon(ic)}
              className={`aspect-square rounded-lg flex items-center justify-center transition ${
                icon === ic ? "bg-navy text-mint-strong" : "bg-white border border-line text-muted"
              }`}
              aria-label={ic}
            >
              <Icon name={ic} size={20} fill={icon === ic} />
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="label-caps text-faint mb-2">Bucket</p>
        <div className="flex gap-2">
          {BUCKETS.map((b) => (
            <button
              key={b.id}
              onClick={() => setBucket(b.id)}
              className={`flex-1 rounded-(--radius-field) border py-2 text-sm font-semibold transition ${
                bucket === b.id ? "border-navy bg-lav text-ink" : "border-line bg-white text-muted"
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {household && (
        <div>
          <p className="label-caps text-faint mb-2">Owner</p>
          <div className="flex gap-2 flex-wrap">
            {(
              [
                { v: null, label: "Unassigned" },
                { v: "p1" as const, label: ownerLabel("p1", settings) ?? "Person 1" },
                { v: "p2" as const, label: ownerLabel("p2", settings) ?? "Person 2" },
                { v: "joint" as const, label: "Joint" },
              ] as { v: OwnerTag; label: string }[]
            ).map((o) => (
              <button
                key={o.label}
                onClick={() => setOwner(o.v)}
                className={`rounded-full px-3 py-1.5 text-sm font-semibold border transition ${
                  owner === o.v
                    ? "border-navy bg-chip text-chip-ink"
                    : "border-line bg-white text-muted"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {bucket === "needs" && (
        <div className="flex items-center justify-between gap-3 rounded-(--radius-field) border border-line bg-white px-3 py-2.5">
          <div>
            <p className="text-sm font-semibold">Fixed cost</p>
            <p className="text-xs text-muted">
              Always counted as paid once planned — no expense logging needed (e.g. rent, utilities).
            </p>
          </div>
          <button
            role="switch"
            aria-checked={autoPaid}
            onClick={() => setAutoPaid((v) => !v)}
            className={`relative w-11 h-6 rounded-full shrink-0 transition-colors ${
              autoPaid ? "bg-emerald" : "bg-lav"
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                autoPaid ? "translate-x-5" : ""
              }`}
            />
          </button>
        </div>
      )}

      {bucket === "savings" && (
        <div>
          <p className="label-caps text-faint mb-2">Investment type</p>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setInvest(null)}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold border transition ${
                !invest ? "border-navy bg-chip text-chip-ink" : "border-line bg-white text-muted"
              }`}
            >
              None
            </button>
            {INVEST_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setInvest(t)}
                className={`rounded-full px-3 py-1.5 text-sm font-semibold border transition ${
                  invest === t
                    ? "border-navy bg-chip text-chip-ink"
                    : "border-line bg-white text-muted"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-error bg-error-light rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 rounded-(--radius-field) border border-line py-2.5 font-semibold text-muted"
        >
          Cancel
        </button>
        <button
          onClick={save}
          disabled={busy}
          className="flex-1 rounded-(--radius-field) bg-navy text-white py-2.5 font-semibold disabled:opacity-60"
        >
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

function CategoryRow({
  cat,
  settings,
  onChanged,
  onNote,
}: {
  cat: Category;
  settings: Settings;
  onChanged: () => void;
  onNote: (msg: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const owner = settings.mode === "household" ? ownerLabel(cat.owner_tag, settings) : null;

  async function toggleArchive() {
    setBusy(true);
    try {
      await api(`/api/categories/${cat.id}`, {
        method: "PUT",
        body: { archived: !cat.archived },
      });
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      const res = await api<{ archived?: boolean; deleted?: boolean }>(
        `/api/categories/${cat.id}`,
        { method: "DELETE" }
      );
      if (res.archived) {
        onNote(`"${cat.name}" has history, so it was archived instead of deleted.`);
      }
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  if (editing) {
    return (
      <EditForm
        cat={cat}
        settings={settings}
        onCancel={() => setEditing(false)}
        onSaved={() => {
          setEditing(false);
          onChanged();
        }}
      />
    );
  }

  return (
    <div
      className={`flex items-center gap-3 rounded-(--radius-field) border border-line bg-white px-3 py-2.5 ${
        cat.archived ? "opacity-55" : ""
      }`}
    >
      <div className="w-9 h-9 rounded-lg bg-lav flex items-center justify-center shrink-0">
        <Icon name={cat.icon || "category"} fill size={20} className="text-navy-soft" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold truncate">{cat.name}</span>
          {cat.archived && (
            <span className="label-caps text-[10px] text-faint bg-slate-surface border border-line px-1.5 py-0.5 rounded">
              Archived
            </span>
          )}
        </div>
        {(owner || cat.invest_type) && (
          <div className="flex items-center gap-1.5 mt-0.5">
            {owner && (
              <span className="text-[11px] font-semibold bg-chip text-chip-ink px-1.5 py-0.5 rounded">
                {owner}
              </span>
            )}
            {cat.invest_type && (
              <span className="text-[11px] font-semibold bg-cream text-amber px-1.5 py-0.5 rounded">
                {cat.invest_type}
              </span>
            )}
          </div>
        )}
      </div>
      <button
        onClick={() => setEditing(true)}
        className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:bg-slate-surface"
        aria-label="Edit category"
      >
        <Icon name="edit" size={18} />
      </button>
      <button
        onClick={toggleArchive}
        disabled={busy}
        className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:bg-slate-surface disabled:opacity-50"
        aria-label={cat.archived ? "Unarchive" : "Archive"}
      >
        <Icon name={cat.archived ? "unarchive" : "archive"} size={18} />
      </button>
      <button
        onClick={remove}
        disabled={busy}
        className="w-8 h-8 rounded-full flex items-center justify-center text-error hover:bg-error-light disabled:opacity-50"
        aria-label="Delete category"
      >
        <Icon name="delete" size={18} />
      </button>
    </div>
  );
}

function AddForm({
  bucket,
  onCancel,
  onAdded,
}: {
  bucket: Bucket;
  onCancel: () => void;
  onAdded: () => void;
}) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add() {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api("/api/categories", { method: "POST", body: { bucket, name: name.trim() } });
      onAdded();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add");
      setBusy(false);
    }
  }

  return (
    <div className="rounded-(--radius-field) border border-navy/30 bg-slate-surface p-3 flex flex-col gap-2 animate-slide-up">
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          onKeyDown={(e) => e.key === "Enter" && add()}
          className="flex-1 rounded-(--radius-field) border border-line bg-white px-3 py-2 outline-none focus:border-navy focus:ring-2 focus:ring-chip"
          placeholder="New category name"
        />
        <button
          onClick={add}
          disabled={busy}
          className="rounded-(--radius-field) bg-navy text-white px-4 font-semibold disabled:opacity-60"
        >
          {busy ? "…" : "Add"}
        </button>
        <button
          onClick={onCancel}
          className="rounded-(--radius-field) border border-line px-3 text-muted font-semibold"
        >
          Cancel
        </button>
      </div>
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  );
}

export function CategoryManager({ settings }: { settings: Settings }) {
  const [open, setOpen] = useState(false);
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [addingBucket, setAddingBucket] = useState<Bucket | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api<Category[]>("/api/categories?archived=1")
      .then((c) => {
        setCats(c);
        setError(null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full p-4 flex items-center gap-3 text-left"
      >
        <Icon name="category" size={22} className="text-navy-soft" />
        <span className="font-semibold flex-1">Category Management</span>
        <Icon name="chevron_right" size={22} className="text-faint" />
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Categories">
        {note && (
          <div className="mb-3 flex items-start gap-2 text-sm bg-cream text-amber rounded-lg px-3 py-2">
            <Icon name="info" size={16} fill className="mt-0.5 shrink-0" />
            <span className="flex-1">{note}</span>
            <button onClick={() => setNote(null)} aria-label="Dismiss">
              <Icon name="close" size={16} />
            </button>
          </div>
        )}
        {error && (
          <p className="mb-3 text-sm text-error bg-error-light rounded-lg px-3 py-2">{error}</p>
        )}
        {loading && cats.length === 0 ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 rounded-full border-[3px] border-lav border-t-navy animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {BUCKETS.map((b) => {
              const rows = cats.filter((c) => c.bucket === b.id);
              return (
                <section key={b.id}>
                  <div className="flex items-center gap-2 mb-2.5">
                    <Icon name={b.icon} fill size={20} className={b.tone} />
                    <h3 className="font-bold">{b.label}</h3>
                    <span className="text-sm text-faint">({rows.length})</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {rows.map((c) => (
                      <CategoryRow
                        key={c.id}
                        cat={c}
                        settings={settings}
                        onChanged={load}
                        onNote={setNote}
                      />
                    ))}
                    {addingBucket === b.id ? (
                      <AddForm
                        bucket={b.id}
                        onCancel={() => setAddingBucket(null)}
                        onAdded={() => {
                          setAddingBucket(null);
                          load();
                        }}
                      />
                    ) : (
                      <button
                        onClick={() => setAddingBucket(b.id)}
                        className="flex items-center gap-1.5 text-sm font-semibold text-emerald-deep py-1.5 px-1 self-start"
                      >
                        <Icon name="add" size={18} />
                        Add category
                      </button>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </Modal>
    </>
  );
}
