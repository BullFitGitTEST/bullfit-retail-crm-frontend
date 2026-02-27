"use client";

import { useEffect, useState } from "react";
import SettingsNav from "@/components/retail-ops/SettingsNav";
import type { StageWeight } from "@/lib/forecast/types";

export default function ForecastSettingsPage() {
  const [weights, setWeights] = useState<StageWeight[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetchWeights();
  }, []);

  async function fetchWeights() {
    try {
      const res = await fetch("/api/forecast/stage-weights");
      if (res.ok) setWeights(await res.json());
    } catch (err) {
      console.error("Failed to fetch stage weights:", err);
    } finally {
      setLoading(false);
    }
  }

  async function updateWeight(stage: string, probability: number) {
    setSaving(stage);
    try {
      const res = await fetch("/api/forecast/stage-weights", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage, probability }),
      });
      if (res.ok) {
        setWeights((prev) =>
          prev.map((w) =>
            w.stage === stage ? { ...w, probability } : w
          )
        );
      }
    } catch (err) {
      console.error("Failed to update weight:", err);
    } finally {
      setSaving(null);
    }
  }

  const stageLabels: Record<string, string> = {
    targeted: "Targeted",
    contact_found: "Contact Found",
    first_touch: "First Touch",
    meeting_booked: "Meeting Booked",
    pitch_delivered: "Pitch Delivered",
    samples_sent: "Samples Sent",
    follow_up: "Follow Up",
    vendor_setup: "Vendor Setup",
    authorization_pending: "Authorization Pending",
    po_received: "PO Received",
    on_shelf: "On Shelf",
    reorder_cycle: "Reorder Cycle",
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-white mb-2">
          Forecast Settings
        </h1>
        <p className="text-slate-400 text-sm mb-6">
          Configure pipeline stage weights for demand forecasting. Higher
          probability = stronger demand signal.
        </p>

        <SettingsNav />

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">
            Pipeline Stage Weights
          </h2>
          <p className="text-slate-400 text-sm mb-4">
            Each opportunity in the pipeline contributes to demand forecast
            weighted by its stage probability. Adjust these to tune forecast
            accuracy.
          </p>

          {loading ? (
            <div className="animate-pulse space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-slate-800 rounded" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {weights.map((w) => (
                <div
                  key={w.stage}
                  className="flex items-center gap-4 rounded-lg border border-slate-700 bg-slate-800 px-4 py-3"
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-white">
                      {stageLabels[w.stage] || w.stage}
                    </span>
                    <span className="ml-2 text-xs text-slate-500 font-mono">
                      {w.stage}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={w.probability}
                      onChange={(e) =>
                        updateWeight(w.stage, parseInt(e.target.value))
                      }
                      className="w-32 accent-indigo-600"
                    />
                    <span
                      className={`w-10 text-right text-sm font-mono ${
                        saving === w.stage
                          ? "text-slate-500"
                          : "text-white"
                      }`}
                    >
                      {w.probability}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Forecast model info */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-4">
            Demand Model
          </h2>
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-4 text-xs text-slate-400 space-y-2">
            <p>
              <strong className="text-white">Method:</strong> Blended Max —
              demand = max(trailing_sales, weighted_opp, retailer_po)
            </p>
            <p>
              <strong className="text-white">Horizons:</strong> 30, 60, 90
              days
            </p>
            <p>
              <strong className="text-white">Procurement:</strong> required
              = demand_60 + safety_stock - (available + on_order), rounded
              up to case pack
            </p>
            <p>
              <strong className="text-white">Schedule:</strong> Daily at 6am
              UTC, accuracy check Mondays at 7am UTC
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
