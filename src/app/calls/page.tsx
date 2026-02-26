"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCalls } from "@/lib/api";
import type { Call } from "@/lib/api";
import HelpPanel from "@/components/HelpPanel";

export default function CallsPage() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    async function fetchCalls() {
      try {
        const data = await getCalls({
          status: statusFilter || undefined,
        });
        setCalls(data);
      } catch (err) {
        console.error("Failed to fetch calls", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCalls();
  }, [statusFilter]);

  function formatDuration(seconds?: number) {
    if (!seconds) return "—";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Call History</h1>
            <p className="mt-1 text-sm text-slate-400">
              AI-powered calls via Bland.ai
            </p>
          </div>
          <div className="self-start sm:self-auto">
            <HelpPanel
              pageKey="calls"
              tagline="A simple call log. Every call you make or receive should be logged here. A call without notes and a next step is wasted."
              sections={[
                {
                  title: "What it is",
                  content: ["A record of every call \u2014 AI-powered outbound calls via Bland.ai plus any manual calls you log. Each entry shows who you called, what was discussed, and the outcome."],
                },
                {
                  title: "What to do here",
                  content: [
                    "Review completed calls and make sure every one has a note and a next step",
                    "Filter by status to find calls that need follow-up",
                    "Use call transcripts to create accurate follow-up tasks and notes",
                    "If a call resulted in a commitment, create a task immediately \u2014 do not rely on memory",
                    "Log manual calls too. If it is not in the system, it did not happen.",
                  ],
                },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="in_progress">In Progress</option>
          <option value="queued">Queued</option>
          <option value="failed">Failed</option>
          <option value="no_answer">No Answer</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center text-slate-400 py-12">Loading calls...</div>
      ) : calls.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-400 mb-2">No calls yet.</p>
          <p className="text-sm text-slate-500">
            Go to a prospect&apos;s page and click &quot;Call&quot; to make your first AI call.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-700">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800/50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-400">Prospect</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-400">Direction</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-400">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-400">Duration</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-400">Outcome</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-400">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-400">Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {calls.map((call) => (
                <tr key={call.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3">
                    {call.prospect_id ? (
                      <Link
                        href={`/prospects/${call.prospect_id}`}
                        className="text-sm font-medium text-white hover:text-indigo-400"
                      >
                        {call.prospects?.business_name || "Unknown"}
                      </Link>
                    ) : (
                      <span className="text-sm text-slate-400">Unknown</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs capitalize px-2 py-0.5 rounded-full ${
                      call.direction === "outbound"
                        ? "bg-blue-600/20 text-blue-400"
                        : "bg-green-600/20 text-green-400"
                    }`}>
                      {call.direction}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs capitalize px-2 py-0.5 rounded-full ${
                      call.status === "completed" ? "bg-green-600/20 text-green-400" :
                      call.status === "in_progress" ? "bg-yellow-600/20 text-yellow-400" :
                      call.status === "failed" ? "bg-red-600/20 text-red-400" :
                      call.status === "no_answer" ? "bg-orange-600/20 text-orange-400" :
                      "bg-slate-600/20 text-slate-400"
                    }`}>
                      {call.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300">
                    {formatDuration(call.duration_seconds)}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400 capitalize">
                    {call.outcome?.replace("_", " ") || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400">
                    {new Date(call.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400 max-w-xs truncate">
                    {call.summary || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
