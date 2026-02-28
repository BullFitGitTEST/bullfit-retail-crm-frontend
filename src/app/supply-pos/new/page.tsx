"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import FeatureFlagGuard from "@/components/retail-ops/FeatureFlagGuard";
import type { Supplier, SupplierProduct } from "@/lib/supply-pos/types";

interface LineItem {
  sku: string;
  product_name: string;
  supplier_sku: string;
  quantity: number;
  unit_cost_cents: number;
}

export default function NewPOPage() {
  return (
    <FeatureFlagGuard flag="supply_pos">
      <NewPOInner />
    </FeatureFlagGuard>
  );
}

function NewPOInner() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [supplierProducts, setSupplierProducts] = useState<SupplierProduct[]>([]);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [creating, setCreating] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    fetch("/api/supply-pos/suppliers")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch suppliers");
        return r.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setSuppliers(data);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedSupplier) {
      fetch(`/api/supply-pos/supplier-products?supplier_id=${selectedSupplier}`)
        .then((r) => {
          if (!r.ok) throw new Error("Failed to fetch supplier products");
          return r.json();
        })
        .then((data) => {
          if (Array.isArray(data)) setSupplierProducts(data);
        })
        .catch(console.error);
    }
  }, [selectedSupplier]);

  function addLine(sp?: SupplierProduct) {
    setLineItems((prev) => [
      ...prev,
      {
        sku: sp?.sku || "",
        product_name: sp?.product_name || "",
        supplier_sku: sp?.supplier_sku || "",
        quantity: sp?.moq || 1,
        unit_cost_cents: sp?.unit_cost_cents || 0,
      },
    ]);
  }

  function updateLine(idx: number, updates: Partial<LineItem>) {
    setLineItems((prev) =>
      prev.map((li, i) => (i === idx ? { ...li, ...updates } : li))
    );
  }

  function removeLine(idx: number) {
    setLineItems((prev) => prev.filter((_, i) => i !== idx));
  }

  const subtotal = lineItems.reduce(
    (sum, li) => sum + li.quantity * li.unit_cost_cents,
    0
  );

  async function createPO() {
    if (!selectedSupplier || lineItems.length === 0) return;
    setCreating(true);
    try {
      const res = await fetch("/api/supply-pos/pos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplier_id: selectedSupplier,
          requested_delivery_date: deliveryDate || null,
          created_by: "harrison@bullfit.com",
          line_items: lineItems,
        }),
      });
      if (res.ok) {
        const po = await res.json();
        router.push(`/supply-pos/${po.id}`);
      }
    } catch (err) {
      console.error("Failed to create PO:", err);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <button
          onClick={() => router.push("/supply-pos")}
          className="text-xs text-slate-500 hover:text-white mb-4"
        >
          &larr; Back to POs
        </button>
        <h1 className="text-2xl font-bold text-white mb-6">
          Create Purchase Order
        </h1>

        {/* Step 1: Select Supplier */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">
              Step 1: Select Supplier
            </h2>
            <div className="space-y-2">
              {suppliers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-400 text-sm mb-3">
                    No suppliers found. Add a supplier first to create a PO.
                  </p>
                  <Link
                    href="/supply-pos/suppliers"
                    className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
                  >
                    + Add Supplier
                  </Link>
                </div>
              ) : (
                suppliers.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSelectedSupplier(s.id);
                      setStep(2);
                    }}
                    className={`w-full text-left rounded-lg border px-4 py-3 transition-colors ${
                      selectedSupplier === s.id
                        ? "border-indigo-500 bg-indigo-500/10"
                        : "border-slate-700 bg-slate-800 hover:border-slate-600"
                    }`}
                  >
                    <span className="text-sm font-medium text-white">
                      {s.name}
                    </span>
                    {s.code && (
                      <span className="ml-2 text-xs text-slate-500">
                        ({s.code})
                      </span>
                    )}
                    <div className="text-xs text-slate-400 mt-0.5">
                      {s.payment_terms} &middot; {s.default_lead_time_days}d lead
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Step 2: Add Line Items */}
        {step === 2 && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">
              Step 2: Add Items
            </h2>

            {/* Quick add from supplier products */}
            {supplierProducts.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-slate-500 mb-2">
                  Quick add from supplier catalog:
                </p>
                <div className="flex flex-wrap gap-1">
                  {supplierProducts.map((sp) => (
                    <button
                      key={sp.id}
                      onClick={() => addLine(sp)}
                      className="rounded bg-slate-800 border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:border-indigo-500"
                    >
                      {sp.sku}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => addLine()}
              className="mb-4 rounded-md border border-dashed border-slate-600 px-3 py-1.5 text-xs text-slate-400 hover:border-slate-500"
            >
              + Add blank line
            </button>

            {lineItems.length > 0 && (
              <div className="space-y-2 mb-4">
                {lineItems.map((li, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-5 gap-2 items-center rounded-lg border border-slate-700 bg-slate-800 px-3 py-2"
                  >
                    <input
                      type="text"
                      value={li.sku}
                      onChange={(e) => updateLine(idx, { sku: e.target.value })}
                      placeholder="SKU"
                      className="rounded bg-slate-700 px-2 py-1 text-xs text-white"
                    />
                    <input
                      type="text"
                      value={li.product_name}
                      onChange={(e) =>
                        updateLine(idx, { product_name: e.target.value })
                      }
                      placeholder="Product"
                      className="rounded bg-slate-700 px-2 py-1 text-xs text-white"
                    />
                    <input
                      type="number"
                      value={li.quantity}
                      onChange={(e) =>
                        updateLine(idx, {
                          quantity: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="Qty"
                      className="rounded bg-slate-700 px-2 py-1 text-xs text-white text-right"
                    />
                    <input
                      type="number"
                      value={li.unit_cost_cents / 100}
                      onChange={(e) =>
                        updateLine(idx, {
                          unit_cost_cents: Math.round(
                            parseFloat(e.target.value) * 100
                          ),
                        })
                      }
                      placeholder="Unit $"
                      step="0.01"
                      className="rounded bg-slate-700 px-2 py-1 text-xs text-white text-right"
                    />
                    <button
                      onClick={() => removeLine(idx)}
                      className="text-red-400 hover:text-red-300 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="mb-4">
              <label className="text-xs text-slate-500">
                Requested Delivery Date
              </label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
              />
            </div>

            <div className="flex items-center justify-between border-t border-slate-700 pt-4">
              <div className="text-sm text-white">
                Subtotal:{" "}
                <span className="font-semibold">
                  ${(subtotal / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setStep(1)}
                  className="rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Back
                </button>
                <button
                  onClick={createPO}
                  disabled={creating || lineItems.length === 0}
                  className="rounded-md bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create PO"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
