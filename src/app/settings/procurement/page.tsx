"use client";

import { useEffect, useState } from "react";
import SettingsNav from "@/components/retail-ops/SettingsNav";

interface ProductMasterRow {
  sku: string;
  case_pack: number;
  moq_units: number;
  safety_stock_units: number;
  lead_time_days: number;
  reorder_point_units: number;
  unit_cost_cents: number | null;
  is_active: boolean;
}

export default function ProcurementSettingsPage() {
  const [products, setProducts] = useState<ProductMasterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSku, setEditingSku] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<ProductMasterRow>>({});

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      // Get product master data
      // For now, show variants that need procurement data
      const res = await fetch("/api/shopify/variants?limit=200");
      if (!res.ok) return;
      const variants = await res.json();

      // Unique SKUs
      const skus: string[] = [...new Set(variants.map((v: { sku: string }) => v.sku).filter(Boolean))] as string[];
      setProducts(
        skus.map((sku) => ({
          sku,
          case_pack: 1,
          moq_units: 1,
          safety_stock_units: 0,
          lead_time_days: 30,
          reorder_point_units: 0,
          unit_cost_cents: null,
          is_active: true,
        }))
      );
    } catch (err) {
      console.error("Failed to fetch:", err);
    } finally {
      setLoading(false);
    }
  }

  function startEdit(sku: string) {
    const row = products.find((p) => p.sku === sku);
    if (row) {
      setEditingSku(sku);
      setEditValues({ ...row });
    }
  }

  async function saveEdit() {
    if (!editingSku) return;
    // TODO: Save to ro_product_master via API
    setProducts((prev) =>
      prev.map((p) =>
        p.sku === editingSku ? { ...p, ...editValues } : p
      )
    );
    setEditingSku(null);
    setEditValues({});
  }

  const missing = products.filter(
    (p) => !p.unit_cost_cents || p.case_pack <= 1
  ).length;

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-white mb-2">
          Procurement Settings
        </h1>
        <p className="text-slate-400 text-sm mb-6">
          Set case packs, MOQs, lead times, and costs for each SKU.
        </p>

        <SettingsNav />

        {missing > 0 && (
          <div className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
            <p className="text-sm text-amber-400">
              {missing} SKUs are missing procurement data (cost or case pack).
            </p>
          </div>
        )}

        {loading ? (
          <div className="animate-pulse space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-slate-800 rounded" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-slate-700">
                  <th className="text-left py-2 px-2 font-medium">SKU</th>
                  <th className="text-right py-2 px-2 font-medium">Case Pack</th>
                  <th className="text-right py-2 px-2 font-medium">MOQ</th>
                  <th className="text-right py-2 px-2 font-medium">Safety Stock</th>
                  <th className="text-right py-2 px-2 font-medium">Lead Time</th>
                  <th className="text-right py-2 px-2 font-medium">Unit Cost</th>
                  <th className="text-right py-2 px-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr
                    key={p.sku}
                    className="border-b border-slate-700/50 hover:bg-slate-800/50"
                  >
                    <td className="py-2 px-2 text-indigo-400 font-mono">
                      {p.sku}
                    </td>
                    {editingSku === p.sku ? (
                      <>
                        <td className="py-2 px-2 text-right">
                          <input
                            type="number"
                            value={editValues.case_pack || ""}
                            onChange={(e) =>
                              setEditValues({
                                ...editValues,
                                case_pack: parseInt(e.target.value) || 1,
                              })
                            }
                            className="w-16 rounded bg-slate-700 px-1 py-0.5 text-right text-white"
                          />
                        </td>
                        <td className="py-2 px-2 text-right">
                          <input
                            type="number"
                            value={editValues.moq_units || ""}
                            onChange={(e) =>
                              setEditValues({
                                ...editValues,
                                moq_units: parseInt(e.target.value) || 1,
                              })
                            }
                            className="w-16 rounded bg-slate-700 px-1 py-0.5 text-right text-white"
                          />
                        </td>
                        <td className="py-2 px-2 text-right">
                          <input
                            type="number"
                            value={editValues.safety_stock_units || ""}
                            onChange={(e) =>
                              setEditValues({
                                ...editValues,
                                safety_stock_units:
                                  parseInt(e.target.value) || 0,
                              })
                            }
                            className="w-16 rounded bg-slate-700 px-1 py-0.5 text-right text-white"
                          />
                        </td>
                        <td className="py-2 px-2 text-right">
                          <input
                            type="number"
                            value={editValues.lead_time_days || ""}
                            onChange={(e) =>
                              setEditValues({
                                ...editValues,
                                lead_time_days: parseInt(e.target.value) || 30,
                              })
                            }
                            className="w-16 rounded bg-slate-700 px-1 py-0.5 text-right text-white"
                          />
                        </td>
                        <td className="py-2 px-2 text-right">
                          <input
                            type="number"
                            value={
                              editValues.unit_cost_cents
                                ? editValues.unit_cost_cents / 100
                                : ""
                            }
                            onChange={(e) =>
                              setEditValues({
                                ...editValues,
                                unit_cost_cents: Math.round(
                                  parseFloat(e.target.value) * 100
                                ),
                              })
                            }
                            className="w-20 rounded bg-slate-700 px-1 py-0.5 text-right text-white"
                            placeholder="$0.00"
                            step="0.01"
                          />
                        </td>
                        <td className="py-2 px-2 text-right">
                          <button
                            onClick={saveEdit}
                            className="text-emerald-400 hover:text-emerald-300 mr-2"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingSku(null)}
                            className="text-slate-400 hover:text-white"
                          >
                            Cancel
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-2 px-2 text-right text-slate-300">
                          {p.case_pack}
                        </td>
                        <td className="py-2 px-2 text-right text-slate-300">
                          {p.moq_units}
                        </td>
                        <td className="py-2 px-2 text-right text-slate-300">
                          {p.safety_stock_units}
                        </td>
                        <td className="py-2 px-2 text-right text-slate-300">
                          {p.lead_time_days}d
                        </td>
                        <td className="py-2 px-2 text-right text-slate-300">
                          {p.unit_cost_cents
                            ? `$${(p.unit_cost_cents / 100).toFixed(2)}`
                            : "—"}
                        </td>
                        <td className="py-2 px-2 text-right">
                          <button
                            onClick={() => startEdit(p.sku)}
                            className="text-indigo-400 hover:text-indigo-300"
                          >
                            Edit
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
