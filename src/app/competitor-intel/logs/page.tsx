"use client";

import { useEffect, useState, useCallback } from "react";
import CompetitorIntelNav from "@/components/competitor-intel/CompetitorIntelNav";
import { getRuns, getRun } from "@/lib/competitor-intel/api-client";
import type { CompetitorRun, RunType } from "@/lib/competitor-intel/types";

const RUN_TYPE_LABELS: Record<string, string> = {
  snapshot_fetch: "Snapshot Fetch",
  extraction: "Extraction",
  diff: "Diff",
  insight_generation: "Insight Generation",
  recommendation_generation: "Recommendation Generation",
};

const STATUS_STYLES: Record<string, string> = {
  success: "bg-green-600/20 text-green-300 border-green-600/30",
  failed: "bg-red-600/20 text-red-300 border-red-600/30",
  running: "bg-blue-600/20 text-blue-300 border-blue-600/30",
};

export default function LogsPage() {
  const [runs, setRuns] = useState<CompetitorRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [selectedRun, setSelectedRun] = useState<CompetitorRun | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadRuns = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getRuns({
        run_type: filterType || undefined,
        status: filterStatus || undefined,
        limit: 100,
      });
      setRuns(data);
    } catch (err) {
      console.error("Failed to load runs:", err);
    } finally {
      setLoading(false);
    }
  }, [filterType, filterStatus]);

  useEffect(() => {
    loadRuns();
  }, [loadRuns]);

  const handleViewRun = async (run: CompetitorRun) => {
    setDetailLoading(true);
    try {
      const full = await getRun(run.id);
      setSelectedRun(full);
    } catch {
      setSelectedRun(run);
    } finally {
      setDetailLoading(false);
    }
  };

  const formatDuration = (start: string, end: string | null) => {
    if (!end) return "running...";
    const ms = new Date(end).getTime() - new Date(start).getTime();
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Runs & Logs</h1>
        <p className="text-sm text-slate-400 mt-1">
          Transparency into every pipeline run, prompt version, and AI output.
        </p>
      </div>

      <CompetitorIntelNav />

      {/* Filters */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:flex">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Run Type</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="">All Types</option>
            {Object.entries(RUN_TYPE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="running">Running</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Runs table */}
        <div
          className={`${selectedRun ? "lg:w-1/2" : "w-full"} transition-all`}
        >
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-indigo-500" />
            </div>
          ) : runs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-700 p-12 text-center">
              <h3 className="text-lg font-medium text-white mb-1">
                No runs yet
              </h3>
              <p className="text-sm text-slate-400">
                Pipeline runs will appear here after the first execution.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-hidden rounded-xl border border-slate-700">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700 bg-slate-800/50">
                      <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                        Run ID
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                        Type
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                        Started
                      </th>
                      <th className="px-3 py-3 text-center text-xs font-medium uppercase tracking-wider text-slate-400">
                        Duration
                      </th>
                      <th className="px-3 py-3 text-center text-xs font-medium uppercase tracking-wider text-slate-400">
                        Status
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                        Model
                      </th>
                      <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-400">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {runs.map((run) => (
                      <tr
                        key={run.id}
                        className={`hover:bg-slate-800/50 cursor-pointer ${
                          selectedRun?.id === run.id ? "bg-slate-800" : ""
                        }`}
                        onClick={() => handleViewRun(run)}
                      >
                        <td className="px-3 py-3 font-mono text-xs text-slate-400">
                          {run.id.slice(0, 8)}
                        </td>
                        <td className="px-3 py-3">
                          <span className="rounded bg-slate-700 px-2 py-0.5 text-xs text-slate-300">
                            {RUN_TYPE_LABELS[run.run_type] || run.run_type}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-xs text-slate-400 whitespace-nowrap">
                          {new Date(run.started_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-3 py-3 text-center text-xs text-slate-400">
                          {formatDuration(run.started_at, run.finished_at)}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${
                              STATUS_STYLES[run.status] || STATUS_STYLES.running
                            }`}
                          >
                            {run.status}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-xs text-slate-400">
                          {run.model || "—"}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewRun(run);
                            }}
                            className="text-xs text-indigo-400 hover:text-indigo-300"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-3">
                {runs.map((run) => (
                  <button
                    key={run.id}
                    onClick={() => handleViewRun(run)}
                    className={`block w-full text-left rounded-xl border border-slate-700 bg-slate-800 p-4 hover:bg-slate-700/50 transition-colors ${
                      selectedRun?.id === run.id ? "ring-1 ring-indigo-500" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="rounded bg-slate-700 px-2 py-0.5 text-xs text-slate-300">
                          {RUN_TYPE_LABELS[run.run_type] || run.run_type}
                        </span>
                        <span className="ml-2 font-mono text-xs text-slate-500">
                          {run.id.slice(0, 8)}
                        </span>
                      </div>
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${
                          STATUS_STYLES[run.status] || STATUS_STYLES.running
                        }`}
                      >
                        {run.status}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                      <span>
                        {new Date(run.started_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                      <span>{formatDuration(run.started_at, run.finished_at)}</span>
                      {run.model && <span>{run.model}</span>}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Run detail panel */}
        {selectedRun && (
          <div className="lg:w-1/2 rounded-xl border border-slate-700 bg-slate-800 p-5 overflow-auto max-h-[80vh]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Run Detail</h2>
              <button
                onClick={() => setSelectedRun(null)}
                className="rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-white"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {detailLoading ? (
              <div className="py-8 text-center text-sm text-slate-500">
                Loading...
              </div>
            ) : (
              <div className="space-y-4">
                {/* Meta info */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg bg-slate-900 p-3">
                    <div className="text-slate-500 mb-1">Run ID</div>
                    <div className="font-mono text-white">{selectedRun.id.slice(0, 12)}</div>
                  </div>
                  <div className="rounded-lg bg-slate-900 p-3">
                    <div className="text-slate-500 mb-1">Type</div>
                    <div className="text-white">
                      {RUN_TYPE_LABELS[selectedRun.run_type] || selectedRun.run_type}
                    </div>
                  </div>
                  <div className="rounded-lg bg-slate-900 p-3">
                    <div className="text-slate-500 mb-1">Prompt Version</div>
                    <div className="text-white">
                      {selectedRun.prompt_version || "N/A"}
                    </div>
                  </div>
                  <div className="rounded-lg bg-slate-900 p-3">
                    <div className="text-slate-500 mb-1">Model</div>
                    <div className="text-white">{selectedRun.model || "N/A"}</div>
                  </div>
                </div>

                {/* Error */}
                {selectedRun.error && (
                  <div className="rounded-lg border border-red-600/30 bg-red-950/20 p-3">
                    <div className="text-xs font-medium text-red-400 mb-1">
                      Error
                    </div>
                    <pre className="text-xs text-red-300 whitespace-pre-wrap">
                      {selectedRun.error}
                    </pre>
                  </div>
                )}

                {/* Input JSON */}
                <div>
                  <h3 className="text-sm font-medium text-slate-300 mb-2">
                    Input Payload
                  </h3>
                  <pre className="rounded-lg bg-slate-900 p-3 text-xs text-slate-300 overflow-auto max-h-40 whitespace-pre-wrap">
                    {JSON.stringify(selectedRun.input_json, null, 2)}
                  </pre>
                </div>

                {/* Output JSON */}
                <div>
                  <h3 className="text-sm font-medium text-slate-300 mb-2">
                    Output
                  </h3>
                  <pre className="rounded-lg bg-slate-900 p-3 text-xs text-slate-300 overflow-auto max-h-60 whitespace-pre-wrap">
                    {JSON.stringify(selectedRun.output_json, null, 2)}
                  </pre>
                </div>

                {/* Citations */}
                {selectedRun.citations && selectedRun.citations.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-300 mb-2">
                      Citations ({selectedRun.citations.length})
                    </h3>
                    <pre className="rounded-lg bg-slate-900 p-3 text-xs text-slate-300 overflow-auto max-h-40 whitespace-pre-wrap">
                      {JSON.stringify(selectedRun.citations, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Compliance */}
                {selectedRun.compliance_json &&
                  Object.keys(selectedRun.compliance_json).length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-slate-300 mb-2">
                        Compliance Check
                      </h3>
                      <pre className="rounded-lg bg-slate-900 p-3 text-xs text-slate-300 overflow-auto max-h-40 whitespace-pre-wrap">
                        {JSON.stringify(selectedRun.compliance_json, null, 2)}
                      </pre>
                    </div>
                  )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
