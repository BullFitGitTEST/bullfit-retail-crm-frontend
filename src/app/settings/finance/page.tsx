"use client";

import { useEffect, useState } from "react";
import SettingsNav from "@/components/retail-ops/SettingsNav";

export default function FinanceSettingsPage() {
  const [threshold, setThreshold] = useState(5000);
  const [paymentTerms, setPaymentTerms] = useState("Net 30");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch("/api/retail-ops/settings?category=finance");
      if (res.ok) {
        const settings = await res.json();
        for (const s of settings) {
          if (s.key === "po_approval_threshold_cents") {
            setThreshold(Number(s.value) / 100);
          }
          if (s.key === "default_payment_terms") {
            setPaymentTerms(String(s.value).replace(/"/g, ""));
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch:", err);
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setSaving(true);
    try {
      await Promise.all([
        fetch("/api/retail-ops/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: "finance",
            key: "po_approval_threshold_cents",
            value: Math.round(threshold * 100),
          }),
        }),
        fetch("/api/retail-ops/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: "finance",
            key: "default_payment_terms",
            value: paymentTerms,
          }),
        }),
      ]);
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-white mb-2">
          Finance Settings
        </h1>
        <p className="text-slate-400 text-sm mb-6">
          Configure PO approval thresholds and payment terms.
        </p>

        <SettingsNav />

        {loading ? (
          <div className="animate-pulse h-40 bg-slate-800 rounded-lg" />
        ) : (
          <div className="space-y-6">
            <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
              <label className="block text-sm font-medium text-white mb-2">
                PO Approval Threshold
              </label>
              <p className="text-xs text-slate-500 mb-3">
                POs above this amount require approval by an ops_manager or
                admin before being sent.
              </p>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">$</span>
                <input
                  type="number"
                  value={threshold}
                  onChange={(e) => setThreshold(parseFloat(e.target.value) || 0)}
                  step="100"
                  className="w-40 rounded-md border border-slate-700 bg-slate-700 px-3 py-2 text-sm text-white"
                />
              </div>
            </div>

            <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
              <label className="block text-sm font-medium text-white mb-2">
                Default Payment Terms
              </label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-60 rounded-md border border-slate-700 bg-slate-700 px-3 py-2 text-sm text-white"
              >
                <option value="Net 15">Net 15</option>
                <option value="Net 30">Net 30</option>
                <option value="Net 45">Net 45</option>
                <option value="Net 60">Net 60</option>
                <option value="COD">COD</option>
                <option value="Prepaid">Prepaid</option>
              </select>
            </div>

            <button
              onClick={save}
              disabled={saving}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
