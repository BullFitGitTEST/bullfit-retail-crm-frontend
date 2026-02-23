"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getDashboardStats } from "@/lib/api";
import type { DashboardStats } from "@/lib/api";
import StageBadge from "@/components/shared/StageBadge";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-slate-400">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="rounded-lg border border-red-800 bg-red-900/20 px-6 py-4 text-red-300">
          {error}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const pipelineCards = [
    { stage: "lead", label: "Leads", count: stats.pipeline.lead || 0, color: "text-blue-400", bg: "bg-blue-600/10" },
    { stage: "contacted", label: "Contacted", count: stats.pipeline.contacted || 0, color: "text-yellow-400", bg: "bg-yellow-600/10" },
    { stage: "interested", label: "Interested", count: stats.pipeline.interested || 0, color: "text-purple-400", bg: "bg-purple-600/10" },
    { stage: "partner", label: "Partners", count: stats.pipeline.partner || 0, color: "text-green-400", bg: "bg-green-600/10" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Sales Dashboard</h1>
        <p className="mt-1 text-sm text-slate-400">
          BullFit retail outreach overview
        </p>
      </div>

      {/* Pipeline Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {pipelineCards.map((card) => (
          <Link
            key={card.stage}
            href={`/prospects?stage=${card.stage}`}
            className="rounded-xl border border-slate-700 bg-slate-800 p-6 transition-colors hover:border-slate-600"
          >
            <p className="text-sm font-medium text-slate-400">{card.label}</p>
            <p className={`mt-2 text-3xl font-bold ${card.color}`}>
              {card.count}
            </p>
          </Link>
        ))}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
          <p className="text-sm font-medium text-slate-400">Total Prospects</p>
          <p className="mt-2 text-3xl font-bold text-white">{stats.total_prospects}</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
          <p className="text-sm font-medium text-slate-400">Tasks Due Today</p>
          <p className="mt-2 text-3xl font-bold text-yellow-400">{stats.tasks_due_today}</p>
          {stats.overdue_tasks > 0 && (
            <p className="mt-1 text-sm text-red-400">{stats.overdue_tasks} overdue</p>
          )}
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
          <p className="text-sm font-medium text-slate-400">Calls This Week</p>
          <p className="mt-2 text-3xl font-bold text-indigo-400">{stats.calls_this_week}</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
          <Link href="/prospects" className="text-sm text-indigo-400 hover:text-indigo-300">
            View all
          </Link>
        </div>
        {stats.recent_activities.length === 0 ? (
          <p className="text-slate-400 text-sm">No activity yet. Start by adding prospects!</p>
        ) : (
          <div className="space-y-3">
            {stats.recent_activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 rounded-lg bg-slate-750 p-3 border border-slate-700/50"
              >
                <div className="mt-0.5">
                  {activity.type === "call" && (
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600/20 text-indigo-400 text-sm">P</span>
                  )}
                  {activity.type === "note" && (
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-600/20 text-blue-400 text-sm">N</span>
                  )}
                  {activity.type === "stage_change" && (
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-purple-600/20 text-purple-400 text-sm">S</span>
                  )}
                  {activity.type === "task_completed" && (
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-green-600/20 text-green-400 text-sm">T</span>
                  )}
                  {activity.type === "email" && (
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-yellow-600/20 text-yellow-400 text-sm">E</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">{activity.title}</p>
                  {activity.prospects && (
                    <p className="text-xs text-slate-400 mt-0.5">{activity.prospects.business_name}</p>
                  )}
                </div>
                <span className="text-xs text-slate-500 whitespace-nowrap">
                  {new Date(activity.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
