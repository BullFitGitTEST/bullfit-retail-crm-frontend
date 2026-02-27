"use client";

import { useEffect, useState } from "react";
import FeatureFlagGuard from "@/components/retail-ops/FeatureFlagGuard";

interface Position {
  sku: string;
  on_hand_units: number;
  reserved_units: number;
  available_units: number;
  on_order_units: number;
  in_transit_units: number;
  alerts: Array<{
    alert_type: string;
    severity: string;
    message: string;
  }>;
  breakdown: Array<{
    location_name: string;
    available: number;
    include_in_on_hand: boolean;
  }>;
}

export default function InventoryPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPositions();
  }, []);

  async function fetchPositions() {
    try {
      const res = await fetch("/api/inventory/positions");
      if (res.ok) setPositions(await res.json());
    } catch (err) {
      console.error("Failed to fetch positions:", err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = search
    ? positions.filter((p) =>
        p.sku.toLowerCase().includes(search.toLowerCase())
      )
    : positions;

  const criticalAlerts = positions.filter((p) =>
    p.alerts.some((a) => a.severity === "critical")
  ).length;
  const warningAlerts = positions.filter((p) =>
    p.alerts.some((a) => a.severity === "warning")
  ).length;

  function toggleExpand(sku: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(sku)) next.delete(sku);
      else next.add(sku);
      return next;
    });
  }

  return (
    <FeatureFlagGuard flag="inventory">
      <div className="min-h-screen bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Inventory</h1>
              <p className="text-slate-400 text-sm mt-1">
                Live inventory positions computed from Shopify + reservations
              </p>
            </div>
            <button
              onClick={fetchPositions}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
            >
              Refresh
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
              <div className="text-xs text-slate-500">Total SKUs</div>
              <div className="text-xl font-semibold text-white">
                {positions.length}
              </div>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
              <div className="text-xs text-slate-500">Critical Alerts</div>
              <div className="text-xl font-semibold text-red-400">
                {criticalAlerts}
              </div>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
              <div className="text-xs text-slate-500">Warnings</div>
              <div className="text-xl font-semibold text-amber-400">
                {warningAlerts}
              </div>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
              <div className="text-xs text-slate-500">Out of Stock</div>
              <div className="text-xl font-semibold text-red-400">
                {positions.filter((p) => p.available_units <= 0).length}
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

          {/* Position Table */}
          {loading ? (
            <div className="animate-pulse space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-14 bg-slate-800 rounded" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              {positions.length === 0
                ? "No inventory data yet. Sync Shopify products first."
                : "No SKUs match your search."}
            </div>
          ) : (
            <div className="space-y-1">
              {/* Header */}
              <div className="hidden md:grid grid-cols-7 gap-2 px-4 py-2 text-xs font-medium text-slate-500">
                <div>SKU</div>
                <div className="text-right">On Hand</div>
                <div className="text-right">Reserved</div>
                <div className="text-right">Available</div>
                <div className="text-right">On Order</div>
                <div className="text-right">In Transit</div>
                <div>Status</div>
              </div>

              {filtered.map((pos) => (
                <div key={pos.sku}>
                  <button
                    onClick={() => toggleExpand(pos.sku)}
                    className="w-full grid grid-cols-2 md:grid-cols-7 gap-2 px-4 py-3 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-750 transition-colors text-left items-center"
                  >
                    <div className="text-sm font-mono text-indigo-400 col-span-2 md:col-span-1">
                      {pos.sku}
                    </div>
                    <div className="text-right text-sm text-white">
                      <span className="md:hidden text-xs text-slate-500 mr-2">On Hand:</span>
                      {pos.on_hand_units}
                    </div>
                    <div className="text-right text-sm text-amber-400">
                      <span className="md:hidden text-xs text-slate-500 mr-2">Reserved:</span>
                      {pos.reserved_units}
                    </div>
                    <div className={`text-right text-sm font-medium ${pos.available_units <= 0 ? "text-red-400" : "text-emerald-400"}`}>
                      <span className="md:hidden text-xs text-slate-500 mr-2">Available:</span>
                      {pos.available_units}
                    </div>
                    <div className="text-right text-sm text-slate-300">
                      <span className="md:hidden text-xs text-slate-500 mr-2">On Order:</span>
                      {pos.on_order_units}
                    </div>
                    <div className="text-right text-sm text-slate-300">
                      <span className="md:hidden text-xs text-slate-500 mr-2">In Transit:</span>
                      {pos.in_transit_units}
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {pos.alerts.map((a, i) => (
                        <span
                          key={i}
                          className={`rounded px-1.5 py-0.5 text-xs ${
                            a.severity === "critical"
                              ? "bg-red-500/10 text-red-400"
                              : a.severity === "warning"
                                ? "bg-amber-500/10 text-amber-400"
                                : "bg-blue-500/10 text-blue-400"
                          }`}
                        >
                          {a.alert_type.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  </button>

                  {expanded.has(pos.sku) && (
                    <div className="mt-1 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-3">
                      <h4 className="text-xs font-medium text-slate-400 mb-2">
                        Location Breakdown
                      </h4>
                      {pos.breakdown.length > 0 ? (
                        <div className="space-y-1">
                          {pos.breakdown.map((b, i) => (
                            <div
                              key={i}
                              className="flex justify-between text-xs"
                            >
                              <span className="text-slate-300">
                                {b.location_name}
                                {!b.include_in_on_hand && (
                                  <span className="text-slate-600 ml-1">
                                    (excluded)
                                  </span>
                                )}
                              </span>
                              <span className="text-white font-mono">
                                {b.available}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500">
                          No location data
                        </p>
                      )}

                      {pos.alerts.length > 0 && (
                        <div className="mt-3">
                          <h4 className="text-xs font-medium text-slate-400 mb-1">
                            Alerts
                          </h4>
                          {pos.alerts.map((a, i) => (
                            <p key={i} className="text-xs text-slate-300">
                              {a.message}
                            </p>
                          ))}
                        </div>
                      )}
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
