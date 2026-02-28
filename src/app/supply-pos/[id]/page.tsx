"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { SupplyPODetail } from "@/lib/supply-pos/types";

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

export default function PODetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [po, setPO] = useState<SupplyPODetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    if (id) fetchPO();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchPO() {
    try {
      const res = await fetch(`/api/supply-pos/pos/${id}`);
      if (res.ok) setPO(await res.json());
    } catch (err) {
      console.error("Failed to fetch PO:", err);
    } finally {
      setLoading(false);
    }
  }

  async function doAction(action: string, body?: Record<string, unknown>) {
    setActing(true);
    try {
      await fetch(`/api/supply-pos/pos/${id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      fetchPO();
    } catch (err) {
      console.error(`Action ${action} failed:`, err);
    } finally {
      setActing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-pulse text-slate-500">Loading PO...</div>
      </div>
    );
  }

  if (!po) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-slate-400">PO not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div>
            <button
              onClick={() => router.push("/supply-pos")}
              className="text-xs text-slate-500 hover:text-white mb-2 flex items-center gap-1"
            >
              &larr; Back to POs
            </button>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white font-mono">
                {po.po_number || "Draft PO"}
              </h1>
              <span
                className={`rounded px-2 py-0.5 text-xs font-medium ${statusColors[po.status]}`}
              >
                {po.status.replace(/_/g, " ")}
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-1">
              {po.supplier?.name} &middot; Created{" "}
              {new Date(po.created_at).toLocaleDateString()}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {po.status === "draft" && (
              <button
                onClick={() => doAction("submit")}
                disabled={acting}
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                Submit for Approval
              </button>
            )}
            {po.status === "pending_approval" && (
              <>
                <button
                  onClick={() =>
                    doAction("approve", { approved_by: "harrison@bullfit.com" })
                  }
                  disabled={acting}
                  className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  onClick={() =>
                    doAction("reject", { note: "Needs revision" })
                  }
                  disabled={acting}
                  className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500 disabled:opacity-50"
                >
                  Reject
                </button>
              </>
            )}
            {po.status === "approved" && (
              <button
                onClick={() => doAction("send")}
                disabled={acting}
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                Send to Supplier
              </button>
            )}
            {!["received", "cancelled"].includes(po.status) && (
              <button
                onClick={() => doAction("cancel")}
                disabled={acting}
                className="rounded-md border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 disabled:opacity-50"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Totals */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-3">
            <div className="text-xs text-slate-500">Subtotal</div>
            <div className="text-lg font-semibold text-white">
              ${(po.subtotal_cents / 100).toFixed(2)}
            </div>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-3">
            <div className="text-xs text-slate-500">Shipping</div>
            <div className="text-lg font-semibold text-white">
              ${(po.shipping_cents / 100).toFixed(2)}
            </div>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-3">
            <div className="text-xs text-slate-500">Tax</div>
            <div className="text-lg font-semibold text-white">
              ${(po.tax_cents / 100).toFixed(2)}
            </div>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-3">
            <div className="text-xs text-slate-500">Total</div>
            <div className="text-lg font-semibold text-indigo-400">
              ${(po.total_cents / 100).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Line Items */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-3">
            Line Items
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-slate-700">
                  <th className="text-left py-2 px-2">SKU</th>
                  <th className="text-left py-2 px-2">Product</th>
                  <th className="text-right py-2 px-2">Qty</th>
                  <th className="text-right py-2 px-2">Unit Cost</th>
                  <th className="text-right py-2 px-2">Total</th>
                  <th className="text-right py-2 px-2">Received</th>
                </tr>
              </thead>
              <tbody>
                {po.line_items.map((li) => (
                  <tr key={li.id} className="border-b border-slate-700/50">
                    <td className="py-2 px-2 font-mono text-indigo-400">
                      {li.sku}
                    </td>
                    <td className="py-2 px-2 text-slate-300">
                      {li.product_name || "—"}
                    </td>
                    <td className="py-2 px-2 text-right text-white">
                      {li.quantity}
                    </td>
                    <td className="py-2 px-2 text-right text-slate-300">
                      ${(li.unit_cost_cents / 100).toFixed(2)}
                    </td>
                    <td className="py-2 px-2 text-right text-white">
                      ${(li.total_cents / 100).toFixed(2)}
                    </td>
                    <td className="py-2 px-2 text-right">
                      <span
                        className={
                          li.received_quantity >= li.quantity
                            ? "text-emerald-400"
                            : li.received_quantity > 0
                              ? "text-amber-400"
                              : "text-slate-500"
                        }
                      >
                        {li.received_quantity}/{li.quantity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Event Timeline */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">
            Timeline
          </h2>
          {po.events.length === 0 ? (
            <p className="text-sm text-slate-500">No events yet</p>
          ) : (
            <div className="space-y-2">
              {po.events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2"
                >
                  <div className="mt-1 h-2 w-2 rounded-full bg-indigo-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-white">
                        {event.event_type.replace(/_/g, " ")}
                      </span>
                      {event.actor && (
                        <span className="text-xs text-slate-500">
                          by {event.actor}
                        </span>
                      )}
                    </div>
                    {event.notes && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        {event.notes}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-slate-600 shrink-0">
                    {new Date(event.created_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
