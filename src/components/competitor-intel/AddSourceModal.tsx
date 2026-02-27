"use client";

import { useState } from "react";
import type { SourceType, FetchFrequency } from "@/lib/competitor-intel/types";

interface AddSourceModalProps {
  isOpen: boolean;
  competitorId: string;
  onClose: () => void;
  onSubmit: (data: {
    competitor_id: string;
    source_type: SourceType;
    url: string;
    fetch_frequency: FetchFrequency;
    notes: string;
  }) => Promise<void>;
}

const SOURCE_TYPES: { value: SourceType; label: string }[] = [
  { value: "website_pdp", label: "Website PDP" },
  { value: "website_collection", label: "Website Collection" },
  { value: "pricing_page", label: "Pricing Page" },
  { value: "amazon_listing", label: "Amazon Listing" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "press", label: "Press / News" },
];

export default function AddSourceModal({
  isOpen,
  competitorId,
  onClose,
  onSubmit,
}: AddSourceModalProps) {
  const [sourceType, setSourceType] = useState<SourceType>("website_pdp");
  const [url, setUrl] = useState("");
  const [frequency, setFrequency] = useState<FetchFrequency>("weekly");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    try {
      await onSubmit({
        competitor_id: competitorId,
        source_type: sourceType,
        url: url.trim(),
        fetch_frequency: frequency,
        notes: notes.trim(),
      });
      setUrl("");
      setNotes("");
      onClose();
    } catch {
      // handled by parent
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-white mb-4">Add Source</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Source Type *
            </label>
            <select
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value as SourceType)}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
            >
              {SOURCE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              URL *
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Fetch Frequency
            </label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as FetchFrequency)}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes about this source..."
              rows={2}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {loading ? "Adding..." : "Add Source"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
