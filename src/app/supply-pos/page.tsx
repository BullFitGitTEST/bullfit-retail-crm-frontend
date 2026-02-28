"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import FeatureFlagGuard from "@/components/retail-ops/FeatureFlagGuard";
import type { POStatus } from "@/lib/supply-pos/types";

interface POListItem {
  id: string;
  po_number: string;
  supplier_name: string;
  status: POStatus;
  total_cents: number;
  created_at: string;
  requested_delivery_date: string | null;
}

const statusColors: Record<string, string> = {
  draft: "bg-slate-600/20 text-slate-400",
  pending_approval: "bg-amber-500/10 text-amber-400",
  approved: "bg-blue-500/10 text-blue-400",
  sent: "bg-indigo-500/10 text-indigo-400",
  acknowledged: "bg-indigo-500/10 text-indigo-400",
  in_production: "bg-purple-500/10 text-purple-400",
  partially_received: "bg-amber-500/10 text-amber-400",
  received: "bg-emerald-500/10 text-emerald-400",
  cancelled: "bg-red-500/10 text-red-400",
};

export default function SupplyPOsPage() {
  const [pos, setPOs] = useState<POListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");

  useEffect(() => {
    fetchPOs();
  }, [statusFilter]);

  async function fetchPOs() {
    try {
      const qs = statusFilter ? `?status=${statusFilter}` : "";
      const res = await fetch(`/api/supply-pos/pos${qs}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setPOs(data);
      }
    } catch (err) {
      console.error("Failed to fetch POs:", err);
    } finally {
      setLoading(false);
    }
  }

  const totalValue = pos.reduce((sum, po) => sum + po.total_cents, 0);
  const openPOs = pos.filter((p) =>
    ["draft", "pending_approval", "approved", "sent", "acknowledged", "in_production"].includes(p.status)
  ).length;

  return (
    <FeatureFlagGuard flag="supply_pos">
      <div className="min-h-screen bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">
                Supply Purchase Orders
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Manage POs to manufacturers and suppliers
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/supply-pos/suppliers"
                className="rounded-md border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:border-slate-500 text-center"
              >
                Manage Suppliers
              </Link>
              <Link
                href="/supply-pos/new"
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 text-center"
              >
                + New PO
              </Link>
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
              <div className="text-xs text-slate-500">Total POs</div>
              <div className="text-xl font-semibold text-white">
                {pos.length}
              </div>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
              <div className="text-xs text-slate-500">Open POs</div>
              <div className="text-xl font-semibold text-indigo-400">
                {openPOs}
              </div>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
              <div className="text-xs text-slate-500">Total Value</div>
              <div className="text-xl font-semibold text-white">
                ${(totalValue / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Status filter */}
          <div className="flex flex-wrap gap-1 mb-4">
            {["", "draft", "pending_approval", "approved", "sent", "in_production", "received", "cancelled"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                  statusFilter === s
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:bg-slate-800"
                }`}
              >
                {s || "All"}
              </button>
            ))}
          </div>

          {/* PO List */}
          {loading ? (
            <div className="animate-pulse space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-slate-800 rounded-lg" />
              ))}
            </div>
          ) : pos.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              No purchase orders found. Create your first PO to get started.
            </div>
          ) : (
            <div className="space-y-2">
              {pos.map((po) => (
                <Link
                  key={po.id}
                  href={`/supply-pos/${po.id}`}
                  className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 hover:border-slate-600 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white font-mono">
                        {po.po_number || "Draft"}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-xs ${statusColors[po.status] || "text-slate-400"}`}
                      >
                        {po.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
                      <span>{po.supplier_name}</span>
                      <span>{new Date(po.created_at).toLocaleDateString()}</span>
                      {po.requested_delivery_date && (
                        <span>Deliver by: {po.requested_delivery_date}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-white">
                      ${(po.total_cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </FeatureFlagGuard>
  );
}
