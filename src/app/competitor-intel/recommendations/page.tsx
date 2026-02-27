"use client";

import { useEffect, useState, useCallback } from "react";
import CompetitorIntelNav from "@/components/competitor-intel/CompetitorIntelNav";
import RecommendationCard from "@/components/competitor-intel/RecommendationCard";
import {
  getRecommendations,
  createTaskFromRecommendation,
} from "@/lib/competitor-intel/api-client";
import type {
  WeeklyRecommendationView,
  RecommendationItem,
} from "@/lib/competitor-intel/types";

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<
    WeeklyRecommendationView[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<"7d" | "14d" | "30d">("7d");

  const loadRecommendations = useCallback(async () => {
    setLoading(true);
    try {
      const days = dateRange === "7d" ? 7 : dateRange === "14d" ? 14 : 30;
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);

      const data = await getRecommendations({
        from_date: fromDate.toISOString().split("T")[0],
      });
      setRecommendations(data);
    } catch (err) {
      console.error("Failed to load recommendations:", err);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  const handleCreateTask = async (
    rec: RecommendationItem,
    competitorName: string
  ) => {
    try {
      const result = await createTaskFromRecommendation(rec, competitorName);
      alert(
        `Task created: "${result.title}" (due ${result.due_date})`
      );
    } catch (err) {
      console.error("Failed to create task:", err);
      alert("Failed to create task. Please try again.");
    }
  };

  const totalRecs = recommendations.reduce(
    (sum, r) => sum + (r.recommendations?.length || 0),
    0
  );
  const highImpact = recommendations.reduce(
    (sum, r) =>
      sum +
      (r.recommendations?.filter((rec) => rec.expected_impact === "high")
        .length || 0),
    0
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Recommendations</h1>
          <p className="text-sm text-slate-400 mt-1">
            AI-generated actions grounded in competitor intelligence evidence.
          </p>
        </div>
        <div className="flex gap-2">
          {(["7d", "14d", "30d"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                dateRange === range
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {range === "7d" ? "Last 7 days" : range === "14d" ? "Last 14 days" : "Last 30 days"}
            </button>
          ))}
        </div>
      </div>

      <CompetitorIntelNav />

      {/* Stats Row */}
      <div className="mb-6 grid grid-cols-3 gap-3 sm:gap-4">
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
          <div className="text-2xl font-bold text-white">
            {recommendations.length}
          </div>
          <div className="text-xs text-slate-400">Competitors with Recs</div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
          <div className="text-2xl font-bold text-white">{totalRecs}</div>
          <div className="text-xs text-slate-400">Total Recommendations</div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
          <div className="text-2xl font-bold text-red-400">{highImpact}</div>
          <div className="text-xs text-slate-400">High Impact Actions</div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-indigo-500" />
        </div>
      ) : recommendations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700 p-12 text-center">
          <div className="text-4xl mb-3">💡</div>
          <h3 className="text-lg font-medium text-white mb-1">
            No recommendations yet
          </h3>
          <p className="text-sm text-slate-400">
            Recommendations are generated weekly from competitor insights. Add
            competitors and sources, then run the weekly pipeline.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {recommendations.map((group) => (
            <div key={`${group.competitor_id}-${group.insight_id}`}>
              {/* Competitor header */}
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    {group.competitor_name}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {group.period_start} — {group.period_end} &middot;{" "}
                    {group.recommendations?.length || 0} actions
                  </p>
                </div>
              </div>

              {/* Recommendation cards */}
              <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
                {(group.recommendations || []).map((rec, idx) => (
                  <RecommendationCard
                    key={`${group.insight_id}-${idx}`}
                    recommendation={rec}
                    competitorName={group.competitor_name}
                    onCreateTask={(r) =>
                      handleCreateTask(r, group.competitor_name)
                    }
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
