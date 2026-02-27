"use client";

import { useState } from "react";
import type { CompetitorPriority } from "@/lib/competitor-intel/types";

interface AddCompetitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    tags: string[];
    priority: CompetitorPriority;
  }) => Promise<void>;
}

const TAG_OPTIONS = [
  "Pre-Workout",
  "Protein",
  "Creatine",
  "Amino Acids",
  "Fat Burner",
  "Vitamins",
  "Hydration",
  "Energy",
  "Mass Gainer",
  "Greens",
];

export default function AddCompetitorModal({
  isOpen,
  onClose,
  onSubmit,
}: AddCompetitorModalProps) {
  const [name, setName] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [priority, setPriority] = useState<CompetitorPriority>("medium");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onSubmit({ name: name.trim(), tags, priority });
      setName("");
      setTags([]);
      setPriority("medium");
      onClose();
    } catch {
      // error handled by parent
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-white mb-4">
          Add Competitor
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Competitor Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Gorilla Mind"
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>

          {/* Category Tags */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Category Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {TAG_OPTIONS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    tags.includes(tag)
                      ? "border-indigo-500 bg-indigo-600/20 text-indigo-300"
                      : "border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) =>
                setPriority(e.target.value as CompetitorPriority)
              }
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Actions */}
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
              disabled={loading || !name.trim()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {loading ? "Adding..." : "Add Competitor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
