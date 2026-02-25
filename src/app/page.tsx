"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getDashboardStats, OPPORTUNITY_STAGES } from "@/lib/api";
import type { EnhancedDashboardStats } from "@/lib/api";

const stageLabelMap: Record<string, string> = {};
for (const s of OPPORTUNITY_STAGES) {
  stageLabelMap[s.id] = s.label;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<EnhancedDashboardStats | null>(null);
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

  const priorities = stats.today_priorities;
  const summary = stats.pipeline_summary;
  const wonLost = stats.won_lost;
  const totalPriorityItems =
    (priorities?.overdue_next_steps?.length || 0) +
    (priorities?.stalled_deals?.length || 0);

  // Activity type icons
  const typeIcons: Record<string, { bg: string; letter: string }> = {
    stage_change: { bg: "bg-purple-600/20 text-purple-400", letter: "S" },
    note: { bg: "bg-blue-600/20 text-blue-400", letter: "N" },
    call: { bg: "bg-indigo-600/20 text-indigo-400", letter: "C" },
    email: { bg: "bg-yellow-600/20 text-yellow-400", letter: "E" },
    meeting: { bg: "bg-teal-600/20 text-teal-400", letter: "M" },
    product_added: { bg: "bg-emerald-600/20 text-emerald-400", letter: "P" },
    document_added: { bg: "bg-orange-600/20 text-orange-400", letter: "D" },
    opportunity_created: { bg: "bg-green-600/20 text-green-400", letter: "+" },
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Sales Dashboard</h1>
        <p className="mt-1 text-sm text-slate-400">
          Today&apos;s priorities and pipeline overview
        </p>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
          <p className="text-xs text-slate-400 uppercase">Active Pipeline</p>
          <p className="mt-1 text-2xl font-bold text-white">
            {summary?.total_active || 0}
          </p>
          <p className="text-xs text-slate-500">opportunities</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
          <p className="text-xs text-slate-400 uppercase">Pipeline Value</p>
          <p className="mt-1 text-2xl font-bold text-emerald-400">
            ${Math.round(summary?.total_value || 0).toLocaleString()}
          </p>
          <p className="text-xs text-slate-500">
            ${Math.round(summary?.weighted_value || 0).toLocaleString()} weighted
          </p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
          <p className="text-xs text-slate-400 uppercase">Won This Month</p>
          <p className="mt-1 text-2xl font-bold text-green-400">
            {wonLost?.won_this_month || 0}
          </p>
          <p className="text-xs text-slate-500">
            ${Math.round(wonLost?.won_value || 0).toLocaleString()}
          </p>
        </div>
        <div
          className={`rounded-xl border p-4 ${
            totalPriorityItems > 0
              ? "border-red-700/50 bg-red-900/10"
              : "border-slate-700 bg-slate-800"
          }`}
        >
          <p className="text-xs text-slate-400 uppercase">Needs Attention</p>
          <p
            className={`mt-1 text-2xl font-bold ${
              totalPriorityItems > 0 ? "text-red-400" : "text-slate-400"
            }`}
          >
            {totalPriorityItems}
          </p>
          <p className="text-xs text-slate-500">
            {summary?.missing_next_step || 0} missing next step
          </p>
        </div>
      </div>

      {/* Pipeline Stage Cards — mini horizontal bar */}
      <div className="mb-6 rounded-xl border border-slate-700 bg-slate-800 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white">Pipeline by Stage</h2>
          <Link
            href="/pipeline"
            className="text-xs text-indigo-400 hover:text-indigo-300"
          >
            View Kanban &rarr;
          </Link>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {OPPORTUNITY_STAGES.map((s) => {
            const stageData = stats.opportunity_pipeline?.[s.id];
            const count = stageData?.count || 0;
            const value = stageData?.total_value || 0;
            return (
              <div
                key={s.id}
                className={`flex-shrink-0 rounded-lg border-t-2 ${s.color} bg-slate-700/30 p-2 min-w-[100px]`}
              >
                <p className="text-[10px] text-slate-400 truncate">{s.label}</p>
                <p className="text-sm font-bold text-white">{count}</p>
                {value > 0 && (
                  <p className="text-[10px] text-emerald-400">
                    ${Math.round(value).toLocaleString()}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Today's Priorities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Overdue Next Steps */}
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <span className="text-red-400">&#9888;</span>
              Overdue Next Steps
            </h2>
            <span className="rounded-full bg-red-600/20 px-2 py-0.5 text-xs font-medium text-red-400">
              {priorities?.overdue_next_steps?.length || 0}
            </span>
          </div>
          {!priorities?.overdue_next_steps?.length ? (
            <p className="text-sm text-slate-500 py-4 text-center">
              All caught up! No overdue items.
            </p>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {priorities.overdue_next_steps.map((item) => {
                const daysOverdue = Math.floor(
                  (new Date().getTime() -
                    new Date(item.next_step_date).getTime()) /
                    (1000 * 60 * 60 * 24)
                );
                return (
                  <Link
                    key={item.id}
                    href={`/opportunities/${item.id}`}
                    className="block rounded-lg border border-red-700/30 bg-red-900/10 p-3 hover:bg-red-900/20 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-white truncate">
                          {item.title}
                        </p>
                        <p className="text-xs text-slate-400">
                          {item.account_name}
                        </p>
                      </div>
                      <span className="text-xs font-medium text-red-400 whitespace-nowrap">
                        {daysOverdue}d overdue
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 truncate">
                      {item.next_step_description || "No description"} &mdash;{" "}
                      {stageLabelMap[item.stage] || item.stage}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Stalled Deals */}
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <span className="text-yellow-400">&#9202;</span>
              Stalled Deals
            </h2>
            <span className="rounded-full bg-yellow-600/20 px-2 py-0.5 text-xs font-medium text-yellow-400">
              {priorities?.stalled_deals?.length || 0}
            </span>
          </div>
          {!priorities?.stalled_deals?.length ? (
            <p className="text-sm text-slate-500 py-4 text-center">
              No stalled deals. Pipeline is moving!
            </p>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {priorities.stalled_deals.map((item) => (
                <Link
                  key={item.id}
                  href={`/opportunities/${item.id}`}
                  className="block rounded-lg border border-yellow-700/30 bg-yellow-900/10 p-3 hover:bg-yellow-900/20 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-white truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-slate-400">
                        {item.account_name}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-yellow-400 whitespace-nowrap">
                      {item.days_stalled}d stalled
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Stuck in {stageLabelMap[item.stage] || item.stage}
                    {item.estimated_value
                      ? ` \u2014 $${item.estimated_value.toLocaleString()}`
                      : ""}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Next Steps + Recent Activity side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming */}
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white">
              Upcoming Next Steps (7 days)
            </h2>
            <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs font-medium text-slate-300">
              {priorities?.upcoming_next_steps?.length || 0}
            </span>
          </div>
          {!priorities?.upcoming_next_steps?.length ? (
            <p className="text-sm text-slate-500 py-4 text-center">
              No upcoming steps scheduled.
            </p>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {priorities.upcoming_next_steps.map((item) => {
                const isToday =
                  new Date(item.next_step_date).toDateString() ===
                  new Date().toDateString();
                return (
                  <Link
                    key={item.id}
                    href={`/opportunities/${item.id}`}
                    className="block rounded-lg border border-slate-700/50 bg-slate-800/50 p-3 hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-white truncate">
                          {item.title}
                        </p>
                        <p className="text-xs text-slate-400">
                          {item.account_name}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-medium whitespace-nowrap ${
                          isToday ? "text-indigo-400" : "text-slate-400"
                        }`}
                      >
                        {isToday
                          ? "Today"
                          : new Date(item.next_step_date).toLocaleDateString(
                              undefined,
                              { weekday: "short", month: "short", day: "numeric" }
                            )}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 truncate">
                      {item.next_step_description || "No description"}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white">Recent Activity</h2>
          </div>
          {!stats.recent_opportunity_activities?.length ? (
            <p className="text-sm text-slate-500 py-4 text-center">
              No activity yet. Start by creating opportunities!
            </p>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {stats.recent_opportunity_activities.map((a) => {
                const icon = typeIcons[a.type] || {
                  bg: "bg-slate-600/20 text-slate-400",
                  letter: "?",
                };
                return (
                  <div
                    key={a.id}
                    className="flex gap-2 rounded-lg border border-slate-700/50 bg-slate-800/50 p-2"
                  >
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] ${icon.bg}`}
                    >
                      {icon.letter}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white truncate">{a.title}</p>
                      <div className="flex items-center gap-2">
                        {a.opportunity_id && (
                          <Link
                            href={`/opportunities/${a.opportunity_id}`}
                            className="text-[10px] text-indigo-400 hover:text-indigo-300 truncate"
                          >
                            {a.opportunity_title}
                          </Link>
                        )}
                        {a.account_name && (
                          <span className="text-[10px] text-slate-500">
                            {a.account_name}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 whitespace-nowrap">
                      {new Date(a.created_at).toLocaleDateString()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
