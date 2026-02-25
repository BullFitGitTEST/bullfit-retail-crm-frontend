"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getReportingData, OPPORTUNITY_STAGES } from "@/lib/api";
import type { ReportingData } from "@/lib/api";

const stageLabelMap: Record<string, string> = {};
for (const s of OPPORTUNITY_STAGES) {
  stageLabelMap[s.id] = s.label;
}
stageLabelMap["closed_lost"] = "Closed Lost";
stageLabelMap["on_hold"] = "On Hold";

export default function ReportingPage() {
  const [data, setData] = useState<ReportingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await getReportingData();
        setData(result);
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
        <div className="text-slate-400">Loading reports...</div>
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

  if (!data) return null;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Reports &amp; Analytics</h1>
        <p className="mt-1 text-sm text-slate-400">
          Pipeline performance, conversion, and forecasting
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
          <p className="text-xs text-slate-400 uppercase">Win Rate</p>
          <p className="mt-1 text-2xl font-bold text-emerald-400">
            {data.win_loss.win_rate}%
          </p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
          <p className="text-xs text-slate-400 uppercase">Avg Days to PO</p>
          <p className="mt-1 text-2xl font-bold text-indigo-400">
            {data.time_to_po.avg_days_to_close ?? "\u2014"}
          </p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
          <p className="text-xs text-slate-400 uppercase">Forecast (Weighted)</p>
          <p className="mt-1 text-2xl font-bold text-emerald-400">
            ${Math.round(data.forecast.totals.weighted_value).toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
          <p className="text-xs text-slate-400 uppercase">Total Won</p>
          <p className="mt-1 text-2xl font-bold text-green-400">
            {data.win_loss.won_total}
          </p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
          <p className="text-xs text-slate-400 uppercase">Total Lost</p>
          <p className="mt-1 text-2xl font-bold text-red-400">
            {data.win_loss.lost_total}
          </p>
        </div>
      </div>

      {/* Expected PO — Next 30 Days */}
      {data.expected_po_30d && data.expected_po_30d.opportunities.length > 0 && (
        <div className="mb-6 rounded-xl border border-slate-700 bg-slate-800 p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">
                Expected PO Dollars &mdash; Next 30 Days
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {data.expected_po_30d.totals.count} deals closing soon &bull;{" "}
                {data.expected_po_30d.totals.with_blockers > 0 && (
                  <span className="text-amber-400">{data.expected_po_30d.totals.with_blockers} with blockers</span>
                )}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-emerald-400">
                ${Math.round(data.expected_po_30d.totals.total_value).toLocaleString()}
              </p>
              <p className="text-xs text-slate-400">
                ${Math.round(data.expected_po_30d.totals.weighted_value).toLocaleString()} weighted
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="pb-2 text-left text-xs text-slate-400">Account</th>
                  <th className="pb-2 text-left text-xs text-slate-400">Opportunity</th>
                  <th className="pb-2 text-center text-xs text-slate-400">Stage</th>
                  <th className="pb-2 text-right text-xs text-slate-400">Close Date</th>
                  <th className="pb-2 text-right text-xs text-slate-400">Value</th>
                  <th className="pb-2 text-right text-xs text-slate-400">Weighted</th>
                  <th className="pb-2 text-center text-xs text-slate-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {data.expected_po_30d.opportunities.map((opp) => {
                  const blockerColors: Record<string, string> = {
                    overdue_next_step: "bg-red-600/20 text-red-300",
                    no_next_step: "bg-yellow-600/20 text-yellow-300",
                    no_contact: "bg-orange-600/20 text-orange-300",
                    no_products: "bg-purple-600/20 text-purple-300",
                    on_track: "bg-emerald-600/20 text-emerald-300",
                  };
                  const blockerLabels: Record<string, string> = {
                    overdue_next_step: "OVERDUE",
                    no_next_step: "NO NEXT STEP",
                    no_contact: "NO CONTACT",
                    no_products: "NO PRODUCTS",
                    on_track: "ON TRACK",
                  };
                  const weighted = (opp.estimated_value || 0) * (opp.probability || 0) / 100;
                  return (
                    <tr key={opp.id}>
                      <td className="py-2 text-sm text-slate-300">{opp.account_name}</td>
                      <td className="py-2 text-sm">
                        <Link href={`/opportunities/${opp.id}`} className="text-indigo-400 hover:text-indigo-300">
                          {opp.title}
                        </Link>
                      </td>
                      <td className="py-2 text-center">
                        <span className="rounded bg-slate-700 px-1.5 py-0.5 text-[10px] text-slate-300">
                          {stageLabelMap[opp.stage] || opp.stage}
                        </span>
                      </td>
                      <td className="py-2 text-sm text-slate-300 text-right">
                        {new Date(opp.expected_close_date).toLocaleDateString()}
                      </td>
                      <td className="py-2 text-sm text-white text-right font-medium">
                        ${Math.round(opp.estimated_value || 0).toLocaleString()}
                      </td>
                      <td className="py-2 text-sm text-emerald-400 text-right">
                        ${Math.round(weighted).toLocaleString()}
                      </td>
                      <td className="py-2 text-center">
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${blockerColors[opp.blocker_type] || "bg-slate-600/20 text-slate-300"}`}>
                          {blockerLabels[opp.blocker_type] || opp.blocker_type}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {data.expected_po_30d.totals.with_blockers > 0 && (
            <p className="mt-3 text-xs text-amber-400 border-t border-slate-700 pt-3">
              {data.expected_po_30d.totals.with_blockers} of {data.expected_po_30d.totals.count} deals have blockers.
              Total at risk: ${Math.round(
                data.expected_po_30d.opportunities
                  .filter((o) => o.blocker_type !== "on_track")
                  .reduce((sum, o) => sum + (o.estimated_value || 0), 0)
              ).toLocaleString()}
            </p>
          )}
        </div>
      )}

      {/* Pipeline Hygiene Score */}
      {data.pipeline_hygiene && data.pipeline_hygiene.total_active > 0 && (
        <div className="mb-6 rounded-xl border border-slate-700 bg-slate-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white">Pipeline Hygiene Score</h2>
            <span className={`text-2xl font-bold ${
              data.pipeline_hygiene.score >= 80 ? "text-emerald-400" :
              data.pipeline_hygiene.score >= 60 ? "text-yellow-400" : "text-red-400"
            }`}>
              {data.pipeline_hygiene.score}%
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: "No Next Step", count: data.pipeline_hygiene.missing_next_step, color: "text-yellow-400" },
              { label: "No Contact", count: data.pipeline_hygiene.missing_contact, color: "text-orange-400" },
              { label: "No Value", count: data.pipeline_hygiene.missing_value, color: "text-purple-400" },
              { label: "No Close Date", count: data.pipeline_hygiene.missing_close_date, color: "text-blue-400" },
              { label: "Overdue Steps", count: data.pipeline_hygiene.overdue_next_steps, color: "text-red-400" },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-slate-700/50 bg-slate-800/50 px-3 py-2">
                <p className="text-[10px] text-slate-400 uppercase">{item.label}</p>
                <p className={`text-lg font-bold ${item.count > 0 ? item.color : "text-slate-600"}`}>
                  {item.count}
                  <span className="text-xs text-slate-500 font-normal"> / {data.pipeline_hygiene!.total_active}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stage Conversion Funnel */}
      <div className="mb-6 rounded-xl border border-slate-700 bg-slate-800 p-4">
        <h2 className="text-sm font-semibold text-white mb-4">
          Stage Conversion Funnel
        </h2>
        <div className="space-y-2">
          {data.conversion_funnel
            .filter((s) => s.stage !== "on_hold")
            .map((stage) => {
              const maxCount = Math.max(
                ...data.conversion_funnel.map((s) => s.count),
                1
              );
              const width = Math.max((stage.count / maxCount) * 100, 2);
              const isWon = ["on_shelf", "reorder_cycle"].includes(stage.stage);
              const isLost = stage.stage === "closed_lost";

              return (
                <div key={stage.stage} className="flex items-center gap-2 sm:gap-3">
                  <span className="text-[10px] sm:text-xs text-slate-400 w-20 sm:w-28 text-right truncate flex-shrink-0">
                    {stageLabelMap[stage.stage] || stage.stage}
                  </span>
                  <div className="flex-1 h-6 bg-slate-700/30 rounded overflow-hidden min-w-0">
                    <div
                      className={`h-full rounded flex items-center px-2 transition-all ${
                        isWon
                          ? "bg-emerald-600/40"
                          : isLost
                          ? "bg-red-600/40"
                          : "bg-indigo-600/40"
                      }`}
                      style={{ width: `${width}%` }}
                    >
                      <span className="text-[10px] font-medium text-white whitespace-nowrap">
                        {stage.count}
                        {stage.percentage > 0 ? ` (${stage.percentage}%)` : ""}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] sm:text-xs text-slate-500 w-16 sm:w-24 text-right flex-shrink-0">
                    ${Math.round(stage.total_value).toLocaleString()}
                  </span>
                </div>
              );
            })}
        </div>
      </div>

      {/* Forecast + Time to PO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Pipeline Forecast */}
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
          <h2 className="text-sm font-semibold text-white mb-4">
            Pipeline Forecast
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="pb-2 text-left text-xs text-slate-400">
                    Stage
                  </th>
                  <th className="pb-2 text-right text-xs text-slate-400">
                    Count
                  </th>
                  <th className="pb-2 text-right text-xs text-slate-400">
                    Total Value
                  </th>
                  <th className="pb-2 text-right text-xs text-slate-400">
                    Weighted
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {data.forecast.by_stage.map((s) => (
                  <tr key={s.stage}>
                    <td className="py-2 text-sm text-white">
                      {stageLabelMap[s.stage] || s.stage}
                    </td>
                    <td className="py-2 text-sm text-slate-300 text-right">
                      {s.count}
                    </td>
                    <td className="py-2 text-sm text-slate-300 text-right">
                      ${Math.round(s.total_value).toLocaleString()}
                    </td>
                    <td className="py-2 text-sm text-emerald-400 text-right font-medium">
                      ${Math.round(s.weighted_value).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-600">
                  <td className="pt-2 text-sm font-semibold text-white">
                    Total
                  </td>
                  <td className="pt-2 text-sm font-semibold text-white text-right">
                    {data.forecast.totals.count}
                  </td>
                  <td className="pt-2 text-sm font-semibold text-white text-right">
                    ${Math.round(data.forecast.totals.total_value).toLocaleString()}
                  </td>
                  <td className="pt-2 text-sm font-bold text-emerald-400 text-right">
                    ${Math.round(data.forecast.totals.weighted_value).toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Time to PO + Stage Velocity */}
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
            <h2 className="text-sm font-semibold text-white mb-3">
              Time to First PO
            </h2>
            {data.time_to_po.total_won === 0 ? (
              <p className="text-sm text-slate-500">
                No closed-won deals yet.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400">Average</p>
                  <p className="text-lg font-bold text-white">
                    {data.time_to_po.avg_days_to_close} days
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Range</p>
                  <p className="text-lg font-bold text-white">
                    {data.time_to_po.min_days}&ndash;{data.time_to_po.max_days}{" "}
                    days
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Deals Won</p>
                  <p className="text-lg font-bold text-green-400">
                    {data.time_to_po.total_won}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Avg Deal Value</p>
                  <p className="text-lg font-bold text-emerald-400">
                    ${Math.round(data.time_to_po.avg_deal_value).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Stage Velocity */}
          {data.stage_velocity.length > 0 && (
            <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
              <h2 className="text-sm font-semibold text-white mb-3">
                Stage Velocity (Avg Days)
              </h2>
              <div className="space-y-2">
                {data.stage_velocity.map((s) => (
                  <div key={s.stage} className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      {stageLabelMap[s.stage] || s.stage}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-slate-700/30 rounded overflow-hidden">
                        <div
                          className="h-full bg-indigo-500/60 rounded"
                          style={{
                            width: `${Math.min(
                              (s.avg_days_in_stage / 30) * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-white font-medium w-10 text-right">
                        {s.avg_days_in_stage}d
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Win/Loss + Lost Reasons + Top Accounts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Monthly Win/Loss */}
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
          <h2 className="text-sm font-semibold text-white mb-3">
            Monthly Win/Loss
          </h2>
          {data.win_loss.monthly.length === 0 ? (
            <p className="text-sm text-slate-500">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {data.win_loss.monthly.map((m) => (
                <div key={m.month}>
                  <p className="text-xs text-slate-400 mb-1">
                    {new Date(m.month + "-01").toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                    })}
                  </p>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 rounded bg-emerald-500/60" style={{ width: `${Math.max(m.won * 20, 4)}%` }} />
                        <span className="text-xs text-emerald-400">{m.won} won</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 rounded bg-red-500/60" style={{ width: `${Math.max(m.lost * 20, 4)}%` }} />
                        <span className="text-xs text-red-400">{m.lost} lost</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lost Reasons */}
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
          <h2 className="text-sm font-semibold text-white mb-3">
            Lost Deal Reasons
          </h2>
          {data.lost_reasons.length === 0 ? (
            <p className="text-sm text-slate-500">No lost deals yet.</p>
          ) : (
            <div className="space-y-2">
              {data.lost_reasons.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-slate-700/50 bg-slate-800/50 px-3 py-2"
                >
                  <span className="text-sm text-slate-300 truncate flex-1">
                    {r.reason}
                  </span>
                  <div className="flex items-center gap-2 ml-2">
                    <span className="text-xs text-red-400 font-medium">
                      {r.count}
                    </span>
                    <span className="text-xs text-slate-500">
                      ${Math.round(r.lost_value).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Accounts */}
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
          <h2 className="text-sm font-semibold text-white mb-3">
            Top Accounts by Value
          </h2>
          {data.top_accounts.length === 0 ? (
            <p className="text-sm text-slate-500">No account data yet.</p>
          ) : (
            <div className="space-y-2">
              {data.top_accounts.map((a) => (
                <Link
                  key={a.id}
                  href={`/accounts/${a.id}`}
                  className="flex items-center justify-between rounded-lg border border-slate-700/50 bg-slate-800/50 px-3 py-2 hover:bg-slate-700/50 transition-colors"
                >
                  <div>
                    <p className="text-sm text-white font-medium truncate">
                      {a.name}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {a.opp_count} opportunity{a.opp_count !== 1 ? "ies" : "y"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-emerald-400 font-medium">
                      ${Math.round(a.total_value).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      ${Math.round(a.weighted_value).toLocaleString()} wtd
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Monthly Pipeline Trend */}
      {data.monthly_trend.length > 0 && (
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
          <h2 className="text-sm font-semibold text-white mb-3">
            Monthly Pipeline Created
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-1">
            {data.monthly_trend.reverse().map((m) => (
              <div key={m.month} className="flex-shrink-0 text-center min-w-[80px]">
                <p className="text-xs text-slate-400 mb-2">
                  {new Date(m.month + "-01").toLocaleDateString(undefined, {
                    month: "short",
                  })}
                </p>
                <div className="mx-auto w-12 bg-slate-700/30 rounded-t" style={{ height: "80px" }}>
                  <div
                    className="w-full bg-indigo-500/50 rounded-t"
                    style={{
                      height: `${Math.min(
                        (m.created / Math.max(...data.monthly_trend.map((t) => t.created), 1)) * 80,
                        80
                      )}px`,
                      marginTop: `${80 - Math.min(
                        (m.created / Math.max(...data.monthly_trend.map((t) => t.created), 1)) * 80,
                        80
                      )}px`,
                    }}
                  />
                </div>
                <p className="text-xs text-white font-medium mt-1">{m.created}</p>
                <p className="text-[10px] text-slate-500">
                  ${Math.round(m.total_value / 1000)}k
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
