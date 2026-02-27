"use client";

import { useEffect, useState } from "react";
import SettingsNav from "@/components/retail-ops/SettingsNav";
import type { FeatureFlag } from "@/lib/retail-ops/types";

export default function SettingsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    fetchFlags();
  }, []);

  async function fetchFlags() {
    try {
      const res = await fetch("/api/retail-ops/feature-flags");
      if (res.ok) {
        setFlags(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch flags:", err);
    } finally {
      setLoading(false);
    }
  }

  async function toggleFlag(flagKey: string, currentValue: boolean) {
    setToggling(flagKey);
    try {
      const res = await fetch("/api/retail-ops/feature-flags", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flag_key: flagKey, is_enabled: !currentValue }),
      });
      if (res.ok) {
        setFlags((prev) =>
          prev.map((f) =>
            f.flag_key === flagKey ? { ...f, is_enabled: !currentValue } : f
          )
        );
      }
    } catch (err) {
      console.error("Failed to toggle flag:", err);
    } finally {
      setToggling(null);
    }
  }

  const flagLabels: Record<string, string> = {
    shopify_sync: "Shopify Sync",
    inventory: "Inventory Management",
    forecast: "Demand Forecasting",
    supply_pos: "Supply Purchase Orders",
    data_health: "Data Health Dashboard",
    ops_runs: "Ops Job Runs",
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-white mb-2">Settings</h1>
        <p className="text-slate-400 text-sm mb-6">
          Manage feature flags, integrations, and system configuration.
        </p>

        <SettingsNav />

        {/* Feature Flags Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">
            Feature Flags
          </h2>
          <p className="text-slate-400 text-sm mb-4">
            Enable or disable modules across the system. Changes take effect
            immediately.
          </p>

          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 bg-slate-800 rounded-lg"
                />
              ))}
            </div>
          ) : flags.length === 0 ? (
            <div className="rounded-lg border border-slate-700 bg-slate-800 p-6 text-center">
              <p className="text-slate-400 text-sm">
                No feature flags found. Run the Phase 0 migration to create the
                feature_flags table.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {flags.map((flag) => (
                <div
                  key={flag.id}
                  className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800 px-4 py-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">
                        {flagLabels[flag.flag_key] || flag.flag_key}
                      </span>
                      <span className="rounded bg-slate-700 px-1.5 py-0.5 text-xs text-slate-400 font-mono">
                        {flag.flag_key}
                      </span>
                    </div>
                    {flag.description && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        {flag.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => toggleFlag(flag.flag_key, flag.is_enabled)}
                    disabled={toggling === flag.flag_key}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                      flag.is_enabled ? "bg-indigo-600" : "bg-slate-600"
                    } ${toggling === flag.flag_key ? "opacity-50" : ""}`}
                    role="switch"
                    aria-checked={flag.is_enabled}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        flag.is_enabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Quick Links */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-4">
            Configuration
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              {
                href: "/settings/integrations/shopify",
                label: "Shopify Integration",
                desc: "API connection, sync schedule, location mapping",
              },
              {
                href: "/settings/procurement",
                label: "Procurement",
                desc: "Product master, MOQ, case packs, lead times",
              },
              {
                href: "/settings/forecast",
                label: "Forecast",
                desc: "Stage weights, buffer days, confidence thresholds",
              },
              {
                href: "/settings/finance",
                label: "Finance",
                desc: "PO approval thresholds, payment terms",
              },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-lg border border-slate-700 bg-slate-800 p-4 hover:border-slate-600 hover:bg-slate-750 transition-colors group"
              >
                <h3 className="text-sm font-medium text-white group-hover:text-indigo-400 transition-colors">
                  {item.label}
                </h3>
                <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
              </a>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
