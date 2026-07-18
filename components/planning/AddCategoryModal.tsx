"use client";

import { useState } from "react";
import { Modal } from "@/components/Modal";
import { api } from "@/lib/client";
import type { Bucket, OwnerTag, Settings } from "@/lib/types";
import { IconPicker } from "./IconPicker";
import { ErrorText, ownerOptions } from "./shared";

export function AddCategoryModal({
  open,
  onClose,
  bucket,
  bucketName,
  settings,
  refresh,
}: {
  open: boolean;
  onClose: () => void;
  bucket: Bucket;
  bucketName: string;
  settings: Settings | null;
  refresh: () => void;
}) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("home");
  const [owner, setOwner] = useState<OwnerTag>("joint");
  const [investType, setInvestType] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const household = settings?.mode === "household";
  const owners = ownerOptions(settings);

  async function submit() {
    if (!name.trim()) {
      setErr("Enter a category name.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await api("/api/categories", {
        method: "POST",
        body: {
          bucket,
          name: name.trim(),
          icon,
          owner_tag: household ? owner : null,
          invest_type: bucket === "savings" && investType.trim() ? investType.trim() : null,
        },
      });
      setName("");
      setInvestType("");
      onClose();
      refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to add category");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`New ${bucketName} category`}>
      <div className="space-y-4">
        <div>
          <label className="label-caps text-faint">Name</label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Groceries"
            className="mt-1 w-full rounded-(--radius-field) border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-navy"
          />
        </div>

        <div>
          <label className="label-caps text-faint">Icon</label>
          <div className="mt-2">
            <IconPicker value={icon} onChange={setIcon} />
          </div>
        </div>

        {household && (
          <div>
            <label className="label-caps text-faint">Owner</label>
            <div className="mt-2 flex gap-2">
              {owners.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setOwner(o.value)}
                  className={`flex-1 rounded-full py-2 text-sm font-semibold border transition ${
                    owner === o.value
                      ? "bg-navy text-white border-navy"
                      : "bg-white text-muted border-line"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {bucket === "savings" && (
          <div>
            <label className="label-caps text-faint">Investment type (optional)</label>
            <input
              value={investType}
              onChange={(e) => setInvestType(e.target.value)}
              placeholder="e.g. ETF, Emergency, Pension"
              className="mt-1 w-full rounded-(--radius-field) border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-navy"
            />
          </div>
        )}

        <ErrorText msg={err} />

        <button
          onClick={submit}
          disabled={busy}
          className="w-full rounded-full bg-navy-deep text-white py-3 font-semibold active:scale-[0.99] transition disabled:opacity-50"
        >
          {busy ? "Adding…" : "Add category"}
        </button>
      </div>
    </Modal>
  );
}
