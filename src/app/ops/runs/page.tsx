"use client";

import { useEffect, useState } from "react";
import FeatureFlagGuard from "@/components/retail-ops/FeatureFlagGuard";
import OpsNav from "@/components/retail-ops/OpsNav";
import JobRunsTable from "@/components/ops/JobRunsTable";
import type { JobRun } from "@/lib/retail-ops/types";

const MODULES = ["", "shopify", "inventory", "forecast", "supply_pos", "competitor_intel"];
const STATUSES = ["", "running", "success", "failed"];

export default function OpsRunsPage() {
  const [runs, setRuns] = useState<JobRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [moduleFilter, setModuleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchRuns();
  }, [moduleFilter, statusFilter]);

  async function fetchRuns() {
    try {
      const params = new URLSearchParams();
      if (moduleFilter) params.set("module", moduleFilter);
      if (statusFilter) params.set("status", statusFilter);
      const qs = params.toString() ? `?${params.toString()}` : "";
      const res = await fetch(`/api/retail-ops/job-runs${qs}`);
      if (res.ok) setRuns(await res.json());
    } catch (err) {
      console.error("Failed to fetch job runs:", err);
    } finally {
      setLoading(false);
    }
  }

  const runningCount = runs.filter((r) => r.status === "running").length;
  const failedCount = runs.filter((r) => r.status === "failed").length;
  const successCount = runs.filter((r) => r.status === "success").length;

  return (
    <FeatureFlagGuard flag="ops_runs">
      <div className="min-h-screen bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-white mb-2">
            Operations
          </h1>
          <p className="text-slate-400 text-sm mb-6">
            Monitor background jobs, sync status, and system health.
          </p>

          <OpsNav />

          {/* Summary */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
              <div className="text-xs text-slate-500">Running</div>
              <div className="text-xl font-semibold text-blue-400">
                {runningCount}
              </div>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
              <div className="text-xs text-slate-500">Succeeded (shown)</div>
              <div className="text-xl font-semibold text-emerald-400">
                {successCount}
              </div>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
              <div className="text-xs text-slate-500">Failed (shown)</div>
              <div className="text-xl font-semibold text-red-400">
                {failedCount}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-4">
            <div>
              <label className="text-xs text-slate-500 block mb-1">
                Module
              </label>
              <select
                value={moduleFilter}
                onChange={(e) => {
                  setLoading(true);
                  setModuleFilter(e.target.value);
                }}
                className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-white"
              >
                {MODULES.map((m) => (
                  <option key={m} value={m}>
                    {m || "All Modules"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setLoading(true);
                  setStatusFilter(e.target.value);
                }}
                className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-white"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s || "All Statuses"}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setLoading(true);
                  fetchRuns();
                }}
                className="rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:text-white hover:border-slate-600"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="animate-pulse space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-slate-800 rounded-lg" />
              ))}
            </div>
          ) : (
            <JobRunsTable
              runs={runs}
              expandedId={expandedId}
              onToggle={(id) =>
                setExpandedId((prev) => (prev === id ? null : id))
              }
            />
          )}
        </div>
      </div>
    </FeatureFlagGuard>
  );
}
