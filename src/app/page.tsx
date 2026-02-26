"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getDashboardStats, getDashboardActions, OPPORTUNITY_STAGES } from "@/lib/api";
import type { EnhancedDashboardStats, ActionItem } from "@/lib/api";
import HelpPanel from "@/components/HelpPanel";

const stageLabelMap: Record<string, string> = {};
for (const s of OPPORTUNITY_STAGES) {
  stageLabelMap[s.id] = s.label;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<EnhancedDashboardStats | null>(null);
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllActions, setShowAllActions] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsData, actionsData] = await Promise.all([
          getDashboardStats(),
          getDashboardActions(),
        ]);
        setStats(statsData);
        setActions(actionsData);
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

  // Action type styling
  const actionStyles: Record<string, { border: string; badge: string; badgeText: string }> = {
    overdue: { border: "border-l-red-500", badge: "bg-red-600/20 text-red-300", badgeText: "OVERDUE" },
    today: { border: "border-l-indigo-500", badge: "bg-indigo-600/20 text-indigo-300", badgeText: "TODAY" },
    set_next_step: { border: "border-l-yellow-500", badge: "bg-yellow-600/20 text-yellow-300", badgeText: "SET NEXT STEP" },
    follow_up: { border: "border-l-slate-500", badge: "bg-slate-600/20 text-slate-300", badgeText: "FOLLOW UP" },
    upcoming: { border: "border-l-emerald-500", badge: "bg-emerald-600/20 text-emerald-300", badgeText: "UPCOMING" },
  };

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

  const visibleActions = showAllActions ? actions : actions.slice(0, 10);

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-white">Sales Dashboard</h1>
            <p className="mt-1 text-sm text-slate-400">
              Today&apos;s priorities and pipeline overview
            </p>
          </div>
          <HelpPanel
            pageKey="dashboard"
            tagline="Do not spend time admiring numbers. Use it to decide who you contact today."
            sections={[
              {
                title: "What it is",
                content: ["Your daily command center. This is where you start every morning."],
              },
              {
                title: "What to do here",
                content: [
                  "Check Tasks Due Today and knock them out first",
                  "Review any overdue follow ups",
                  "Open Pipeline items that are stalled and set a next step date",
                  "Add at least one new Prospect if your pipeline is light",
                ],
              },
              {
                title: "The standard workflow",
                content: [
                  "1. Add a retailer to Prospects",
                  "2. Convert to an Account when you find a real target and contact path",
                  "3. Create an Opportunity in Pipeline when there is a real sales motion",
                  "4. Assign a Sequence when you need consistent outreach",
                  "5. Log calls and notes after every interaction",
                  "6. Create tasks for every next step",
                  "7. Move stages only when the real world step happened",
                  "8. Use Reports weekly to spot stalled deals and fix them",
                ],
              },
              {
                title: "Daily minimum expectations",
                content: [
                  "Every active opportunity has a next step date",
                  "Every meaningful call has notes and a follow up task",
                  "Every week you add new prospects so pipeline stays full",
                ],
              },
            ]}
          />
        </div>
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

      {/* Action Console — ranked next-best-actions */}
      {actions.length > 0 && (
        <div className="mb-6 rounded-xl border border-slate-700 bg-slate-800 p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <span className="text-lg">&#9889;</span>
                Action Console
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {actions.filter((a) => a.action_type === "overdue").length} overdue &bull;{" "}
                {actions.filter((a) => a.action_type === "today").length} due today &bull;{" "}
                {actions.filter((a) => a.action_type === "set_next_step").length} need next step
              </p>
            </div>
            <Link href="/pipeline" className="text-xs text-indigo-400 hover:text-indigo-300">
              View Pipeline &rarr;
            </Link>
          </div>

          <div className="space-y-2">
            {visibleActions.map((action) => {
              const style = actionStyles[action.action_type] || actionStyles.follow_up;
              return (
                <Link
                  key={action.id}
                  href={`/opportunities/${action.id}`}
                  className={`block rounded-lg border border-slate-700/50 border-l-4 ${style.border} bg-slate-800/50 p-3 hover:bg-slate-700/50 transition-colors`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-white truncate">
                          {action.title}
                        </p>
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium flex-shrink-0 ${style.badge}`}>
                          {style.badgeText}
                        </span>
                        <span className="rounded bg-slate-700 px-1.5 py-0.5 text-[10px] text-slate-300 flex-shrink-0">
                          {stageLabelMap[action.stage] || action.stage}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {action.account_name}
                        {action.location_name && ` \u2022 ${action.location_name}`}
                        {action.contact_name && action.contact_name.trim() && ` \u2022 ${action.contact_name}`}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {action.action_description}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {action.estimated_value ? (
                        <p className="text-sm font-medium text-emerald-400">
                          ${Math.round(action.estimated_value).toLocaleString()}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-600">No value</p>
                      )}
                      {action.product_count > 0 && (
                        <p className="text-[10px] text-slate-500">{action.product_count} products</p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {actions.length > 10 && (
            <button
              onClick={() => setShowAllActions(!showAllActions)}
              className="mt-3 w-full rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-400 hover:bg-slate-700/50 transition-colors"
            >
              {showAllActions ? "Show Less" : `Show All ${actions.length} Actions`}
            </button>
          )}
        </div>
      )}

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
