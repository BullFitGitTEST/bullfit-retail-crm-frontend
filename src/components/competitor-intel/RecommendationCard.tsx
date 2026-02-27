"use client";

import { useState } from "react";
import type { RecommendationItem } from "@/lib/competitor-intel/types";
import CitationLink from "./CitationLink";

const ACTION_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  update_pitch: { label: "Update Pitch", color: "bg-blue-600/20 text-blue-300 border-blue-600/30" },
  update_template: { label: "Update Template", color: "bg-purple-600/20 text-purple-300 border-purple-600/30" },
  update_sequence: { label: "Update Sequence", color: "bg-cyan-600/20 text-cyan-300 border-cyan-600/30" },
  update_pricing_sheet: { label: "Update Pricing", color: "bg-amber-600/20 text-amber-300 border-amber-600/30" },
  create_one_pager: { label: "Create One-Pager", color: "bg-green-600/20 text-green-300 border-green-600/30" },
  add_objection_response: { label: "Objection Response", color: "bg-rose-600/20 text-rose-300 border-rose-600/30" },
};

const IMPACT_STYLES: Record<string, string> = {
  high: "bg-red-600/20 text-red-300 border-red-600/30",
  medium: "bg-amber-600/20 text-amber-300 border-amber-600/30",
  low: "bg-slate-600/20 text-slate-300 border-slate-600/30",
};

interface RecommendationCardProps {
  recommendation: RecommendationItem;
  competitorName: string;
  onCreateTask: (rec: RecommendationItem) => Promise<void>;
}

export default function RecommendationCard({
  recommendation,
  competitorName,
  onCreateTask,
}: RecommendationCardProps) {
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(false);

  const actionMeta =
    ACTION_TYPE_LABELS[recommendation.action_type] || ACTION_TYPE_LABELS.update_pitch;
  const impactStyle =
    IMPACT_STYLES[recommendation.expected_impact] || IMPACT_STYLES.medium;

  const handleCreateTask = async () => {
    setCreating(true);
    try {
      await onCreateTask(recommendation);
      setCreated(true);
    } catch {
      // parent handles error
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-sm font-semibold text-white leading-snug">
          {recommendation.title}
        </h3>
        <div className="flex shrink-0 gap-2">
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${actionMeta.color}`}
          >
            {actionMeta.label}
          </span>
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${impactStyle}`}
          >
            {recommendation.expected_impact}
          </span>
        </div>
      </div>

      {/* Why it matters */}
      <p className="text-sm text-slate-300 mb-3 leading-relaxed">
        {recommendation.why_it_matters}
      </p>

      {/* Citations */}
      {recommendation.citations.length > 0 && (
        <div className="mb-4">
          <div className="text-xs text-slate-500 mb-1.5">Evidence</div>
          <div className="flex flex-wrap gap-1.5">
            {recommendation.citations.map((c, i) => (
              <CitationLink key={i} citation={c} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Create Task */}
      <div className="flex items-center justify-between border-t border-slate-700 pt-3">
        <span className="text-xs text-slate-500">
          Competitor: {competitorName}
        </span>
        {created ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Task Created
          </span>
        ) : (
          <button
            onClick={handleCreateTask}
            disabled={creating}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
          >
            {creating ? "Creating..." : "Create CRM Task"}
          </button>
        )}
      </div>
    </div>
  );
}
