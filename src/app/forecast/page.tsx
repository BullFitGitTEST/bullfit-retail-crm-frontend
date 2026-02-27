"use client";

import { useEffect, useState } from "react";
import FeatureFlagGuard from "@/components/retail-ops/FeatureFlagGuard";
import type { ForecastSkuLine } from "@/lib/forecast/types";

export default function ForecastPage() {
  const [lines, setLines] = useState<ForecastSkuLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedSku, setExpandedSku] = useState<string | null>(null);
  const [runTriggered, setRunTriggered] = useState(false);

  useEffect(() => {
    fetchLines();
  }, []);

  async function fetchLines() {
    try {
      const res = await fetch("/api/forecast/sku-lines");
      if (res.ok) setLines(await res.json());
    } catch (err) {
      console.error("Failed to fetch forecast lines:", err);
    } finally {
      setLoading(false);
    }
  }

  async function triggerRun() {
    setRunTriggered(true);
    try {
      await fetch("/api/forecast/run/daily", { method: "POST" });
      setTimeout(() => {
        fetchLines();
        setRunTriggered(false);
      }, 5000);
    } catch {
      setRunTriggered(false);
    }
  }

  const filtered = search
    ? lines.filter((l) =>
        l.sku.toLowerCase().includes(search.toLowerCase())
      )
    : lines;

  const needsOrder = lines.filter((l) => l.suggested_order_units > 0).length;
  const lowConfidence = lines.filter((l) => l.confidence_30 < 30).length;

  return (
    <FeatureFlagGuard flag="forecast">
      <div className="min-h-screen bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">
                Demand Forecast
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Blended demand model: max(trailing sales, weighted opps,
                retailer POs)
              </p>
            </div>
            <button
              onClick={triggerRun}
              disabled={runTriggered}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {runTriggered ? "Running..." : "Run Forecast"}
            </button>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
              <div className="text-xs text-slate-500">SKUs Forecasted</div>
              <div className="text-xl font-semibold text-white">
                {lines.length}
              </div>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
              <div className="text-xs text-slate-500">Needs Reorder</div>
              <div className="text-xl font-semibold text-amber-400">
                {needsOrder}
              </div>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
              <div className="text-xs text-slate-500">Low Confidence</div>
              <div className="text-xl font-semibold text-red-400">
                {lowConfidence}
              </div>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
              <div className="text-xs text-slate-500">With Risk Flags</div>
              <div className="text-xl font-semibold text-amber-400">
                {lines.filter((l) => l.risk_flags.length > 0).length}
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search by SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Table */}
          {loading ? (
            <div className="animate-pulse space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-14 bg-slate-800 rounded" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              {lines.length === 0
                ? "No forecast data yet. Run a forecast to generate demand projections."
                : "No SKUs match your search."}
            </div>
          ) : (
            <div className="space-y-1">
              {/* Header */}
              <div className="hidden lg:grid grid-cols-9 gap-2 px-4 py-2 text-xs font-medium text-slate-500">
                <div>SKU</div>
                <div className="text-right">30d Demand</div>
                <div className="text-right">60d Demand</div>
                <div className="text-right">90d Demand</div>
                <div className="text-right">Trailing 30d</div>
                <div className="text-right">Opp Wtd</div>
                <div className="text-right">Conf</div>
                <div className="text-right">Order Qty</div>
                <div>Flags</div>
              </div>

              {filtered.map((line) => (
                <div key={line.sku}>
                  <button
                    onClick={() =>
                      setExpandedSku(
                        expandedSku === line.sku ? null : line.sku
                      )
                    }
                    className="w-full grid grid-cols-2 lg:grid-cols-9 gap-2 px-4 py-3 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-750 transition-colors text-left items-center"
                  >
                    <div className="text-sm font-mono text-indigo-400 col-span-2 lg:col-span-1">
                      {line.sku}
                    </div>
                    <div className="text-right text-sm text-white font-medium">
                      <span className="lg:hidden text-xs text-slate-500 mr-1">30d:</span>
                      {line.demand_units_30}
                    </div>
                    <div className="text-right text-sm text-slate-300">
                      <span className="lg:hidden text-xs text-slate-500 mr-1">60d:</span>
                      {line.demand_units_60}
                    </div>
                    <div className="text-right text-sm text-slate-300">
                      <span className="lg:hidden text-xs text-slate-500 mr-1">90d:</span>
                      {line.demand_units_90}
                    </div>
                    <div className="text-right text-sm text-slate-400">
                      <span className="lg:hidden text-xs text-slate-500 mr-1">Trail:</span>
                      {line.trailing_30_day_units}
                    </div>
                    <div className="text-right text-sm text-slate-400">
                      <span className="lg:hidden text-xs text-slate-500 mr-1">Opp:</span>
                      {line.weighted_opp_units_30}
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${
                          line.confidence_30 >= 70
                            ? "bg-emerald-500/10 text-emerald-400"
                            : line.confidence_30 >= 40
                              ? "bg-amber-500/10 text-amber-400"
                              : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        {line.confidence_30}%
                      </span>
                    </div>
                    <div className="text-right text-sm">
                      {line.suggested_order_units > 0 ? (
                        <span className="text-amber-400 font-medium">
                          {line.suggested_order_units}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {line.risk_flags.map((flag) => (
                        <span
                          key={flag}
                          className="rounded bg-red-500/10 px-1.5 py-0.5 text-xs text-red-400"
                        >
                          {flag.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  </button>

                  {/* Explanation panel */}
                  {expandedSku === line.sku && line.explanation_json && (
                    <div className="mt-1 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-3 space-y-3">
                      {/* Trailing sales */}
                      <div>
                        <h4 className="text-xs font-medium text-slate-400 mb-1">
                          Trailing Sales ({line.explanation_json.trailing_sales.days}d)
                        </h4>
                        <p className="text-xs text-slate-300">
                          {line.explanation_json.trailing_sales.total_units} units
                          ({line.explanation_json.trailing_sales.daily_avg}/day avg)
                        </p>
                      </div>

                      {/* Opportunity signals */}
                      {line.explanation_json.opportunity_signals.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-slate-400 mb-1">
                            Opportunity Signals
                          </h4>
                          {line.explanation_json.opportunity_signals.map(
                            (sig, i) => (
                              <p key={i} className="text-xs text-slate-300">
                                Stage: {sig.stage} — {sig.monthly_units} units
                                @ {(sig.weight * 100).toFixed(0)}% ={" "}
                                {sig.weighted_units} weighted
                              </p>
                            )
                          )}
                        </div>
                      )}

                      {/* Procurement */}
                      <div>
                        <h4 className="text-xs font-medium text-slate-400 mb-1">
                          Procurement
                        </h4>
                        <p className="text-xs text-slate-300">
                          Safety stock: {line.explanation_json.procurement.safety_stock}
                          {" | "}Required: {line.explanation_json.procurement.required}
                          {" | "}Order: {line.explanation_json.procurement.suggested_order_units}
                          {line.explanation_json.procurement.suggested_order_date && (
                            <> by {line.explanation_json.procurement.suggested_order_date}</>
                          )}
                        </p>
                      </div>

                      {/* Inventory context */}
                      <div>
                        <h4 className="text-xs font-medium text-slate-400 mb-1">
                          Current Inventory
                        </h4>
                        <p className="text-xs text-slate-300">
                          On hand: {line.explanation_json.inventory.on_hand}
                          {" | "}Reserved: {line.explanation_json.inventory.reserved}
                          {" | "}Available: {line.explanation_json.inventory.available}
                          {" | "}On order: {line.explanation_json.inventory.on_order}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </FeatureFlagGuard>
  );
}
