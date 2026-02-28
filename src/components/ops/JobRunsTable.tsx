"use client";

import type { JobRun } from "@/lib/retail-ops/types";

interface JobRunsTableProps {
  runs: JobRun[];
  expandedId: string | null;
  onToggle: (id: string) => void;
}

const statusColors: Record<string, string> = {
  running: "bg-blue-500/10 text-blue-400",
  success: "bg-emerald-500/10 text-emerald-400",
  failed: "bg-red-500/10 text-red-400",
  cancelled: "bg-slate-600/20 text-slate-400",
};

const triggerColors: Record<string, string> = {
  cron: "text-slate-500",
  manual: "text-indigo-400",
  webhook: "text-amber-400",
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function durationStr(start: string, end: string | null): string {
  if (!end) return "running...";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 1000) return `${ms}ms`;
  const secs = Math.round(ms / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  const remainSecs = secs % 60;
  return `${mins}m ${remainSecs}s`;
}

export default function JobRunsTable({
  runs,
  expandedId,
  onToggle,
}: JobRunsTableProps) {
  if (runs.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        No job runs found.
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {runs.map((run) => (
        <div key={run.id}>
          <button
            onClick={() => onToggle(run.id)}
            className="w-full text-left flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 hover:border-slate-600 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-white">
                  {run.job_type}
                </span>
                <span
                  className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                    statusColors[run.status] || "text-slate-400"
                  }`}
                >
                  {run.status}
                </span>
                <span
                  className={`text-xs ${
                    triggerColors[run.trigger_type] || "text-slate-500"
                  }`}
                >
                  {run.trigger_type}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
                <span>{run.module}</span>
                <span>{timeAgo(run.started_at)}</span>
                <span>
                  {durationStr(run.started_at, run.finished_at)}
                </span>
              </div>
            </div>
            <svg
              className={`h-4 w-4 text-slate-500 transition-transform ${
                expandedId === run.id ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {expandedId === run.id && (
            <div className="rounded-b-lg border border-t-0 border-slate-700 bg-slate-800/50 px-4 py-3 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500">Started</span>
                  <div className="text-slate-300">
                    {new Date(run.started_at).toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Finished</span>
                  <div className="text-slate-300">
                    {run.finished_at
                      ? new Date(run.finished_at).toLocaleString()
                      : "—"}
                  </div>
                </div>
              </div>

              {run.error && (
                <div>
                  <span className="text-xs text-red-400 font-medium">
                    Error
                  </span>
                  <pre className="mt-1 rounded bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-300 whitespace-pre-wrap overflow-x-auto">
                    {run.error}
                  </pre>
                </div>
              )}

              {run.output_json &&
                Object.keys(run.output_json).length > 0 && (
                  <div>
                    <span className="text-xs text-slate-500">Output</span>
                    <pre className="mt-1 rounded bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-slate-300 whitespace-pre-wrap overflow-x-auto max-h-40">
                      {JSON.stringify(run.output_json, null, 2)}
                    </pre>
                  </div>
                )}

              {run.input_json &&
                Object.keys(run.input_json).length > 0 && (
                  <div>
                    <span className="text-xs text-slate-500">Input</span>
                    <pre className="mt-1 rounded bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-slate-300 whitespace-pre-wrap overflow-x-auto max-h-40">
                      {JSON.stringify(run.input_json, null, 2)}
                    </pre>
                  </div>
                )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
