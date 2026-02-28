"use client";

import { useEffect, useState } from "react";
import FeatureFlagGuard from "@/components/retail-ops/FeatureFlagGuard";
import OpsNav from "@/components/retail-ops/OpsNav";
import DataHealthCard from "@/components/ops/DataHealthCard";
import type { DataHealthSummary } from "@/lib/data-health/types";

export default function DataHealthPage() {
  const [health, setHealth] = useState<DataHealthSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchHealth();
  }, []);

  async function fetchHealth() {
    setLoading(true);
    try {
      const res = await fetch("/api/ops/data-health");
      if (res.ok) setHealth(await res.json());
    } catch (err) {
      console.error("Failed to fetch data health:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <FeatureFlagGuard flag="data_health">
      <div className="min-h-screen bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-white mb-2">
            Operations
          </h1>
          <p className="text-slate-400 text-sm mb-6">
            Monitor background jobs, sync status, and system health.
          </p>

          <OpsNav />

          {/* Summary cards */}
          {health && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
                <div className="text-xs text-slate-500">Total Checks</div>
                <div className="text-xl font-semibold text-white">
                  {health.total_issues}
                </div>
              </div>
              <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4">
                <div className="text-xs text-red-400/70">Critical</div>
                <div className="text-xl font-semibold text-red-400">
                  {health.critical_count}
                </div>
              </div>
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
                <div className="text-xs text-amber-400/70">Warnings</div>
                <div className="text-xl font-semibold text-amber-400">
                  {health.warning_count}
                </div>
              </div>
              <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-4">
                <div className="text-xs text-blue-400/70">Info</div>
                <div className="text-xl font-semibold text-blue-400">
                  {health.info_count}
                </div>
              </div>
            </div>
          )}

          {health && (
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-slate-500">
                Last checked:{" "}
                {new Date(health.checked_at).toLocaleString()}
              </p>
              <button
                onClick={fetchHealth}
                disabled={loading}
                className="rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:border-slate-600 disabled:opacity-50"
              >
                {loading ? "Checking..." : "Re-check"}
              </button>
            </div>
          )}

          {/* Health checks */}
          {loading && !health ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-slate-800 rounded-lg" />
              ))}
            </div>
          ) : health && health.checks.length === 0 ? (
            <div className="text-center py-16">
              <div className="rounded-full bg-emerald-500/10 inline-flex p-6 mb-4">
                <svg
                  className="h-12 w-12 text-emerald-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-white mb-1">
                All Clear
              </h2>
              <p className="text-slate-400 text-sm">
                No data quality issues detected. Everything looks healthy.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Critical first, then warning, then info */}
              {health?.checks
                .sort((a, b) => {
                  const order = { critical: 0, warning: 1, info: 2 };
                  return (
                    (order[a.severity] ?? 3) - (order[b.severity] ?? 3)
                  );
                })
                .map((issue) => (
                  <DataHealthCard
                    key={issue.category}
                    issue={issue}
                    isExpanded={expandedCategory === issue.category}
                    onToggle={() =>
                      setExpandedCategory((prev) =>
                        prev === issue.category ? null : issue.category
                      )
                    }
                  />
                ))}
            </div>
          )}
        </div>
      </div>
    </FeatureFlagGuard>
  );
}
