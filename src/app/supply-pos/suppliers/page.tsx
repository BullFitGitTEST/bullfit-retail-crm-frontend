"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import FeatureFlagGuard from "@/components/retail-ops/FeatureFlagGuard";
import type { Supplier, SupplierProduct } from "@/lib/supply-pos/types";

export default function SuppliersPage() {
  return (
    <FeatureFlagGuard flag="supply_pos">
      <SuppliersInner />
    </FeatureFlagGuard>
  );
}

/* ── blank forms ─────────────────────────────────────────────────────── */

const blankSupplier = {
  name: "",
  code: "",
  contact_name: "",
  contact_email: "",
  contact_phone: "",
  address: "",
  payment_terms: "Net 30",
  default_lead_time_days: 30,
};

const blankProduct = {
  sku: "",
  supplier_sku: "",
  product_name: "",
  unit_cost_cents: 0,
  moq: 1,
  case_pack: 1,
  lead_time_days: null as number | null,
};

/* ── main ────────────────────────────────────────────────────────────── */

function SuppliersInner() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  // supplier form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(blankSupplier);
  const [saving, setSaving] = useState(false);

  // expanded supplier → show products
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [products, setProducts] = useState<SupplierProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // product form
  const [showProductForm, setShowProductForm] = useState(false);
  const [productForm, setProductForm] = useState(blankProduct);
  const [savingProduct, setSavingProduct] = useState(false);

  /* ── fetch suppliers ─────────────────────────────────────────────── */

  useEffect(() => {
    fetchSuppliers();
  }, []);

  async function fetchSuppliers() {
    try {
      const res = await fetch("/api/supply-pos/suppliers");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setSuppliers(data);
      }
    } catch (err) {
      console.error("Failed to fetch suppliers:", err);
    } finally {
      setLoading(false);
    }
  }

  /* ── fetch products for a supplier ───────────────────────────────── */

  async function fetchProducts(supplierId: string) {
    setLoadingProducts(true);
    try {
      const res = await fetch(
        `/api/supply-pos/supplier-products?supplier_id=${supplierId}`
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setProducts(data);
      }
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setLoadingProducts(false);
    }
  }

  function toggleExpand(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
      setProducts([]);
      setShowProductForm(false);
    } else {
      setExpandedId(id);
      fetchProducts(id);
      setShowProductForm(false);
    }
  }

  /* ── save supplier (create or update) ────────────────────────────── */

  async function saveSupplier() {
    setSaving(true);
    try {
      const url = "/api/supply-pos/suppliers";
      const method = editingId ? "PATCH" : "POST";
      const body = editingId ? { id: editingId, ...form } : form;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setShowForm(false);
        setEditingId(null);
        setForm(blankSupplier);
        fetchSuppliers();
      }
    } catch (err) {
      console.error("Failed to save supplier:", err);
    } finally {
      setSaving(false);
    }
  }

  function openEditForm(s: Supplier) {
    setEditingId(s.id);
    setForm({
      name: s.name,
      code: s.code || "",
      contact_name: s.contact_name || "",
      contact_email: s.contact_email || "",
      contact_phone: s.contact_phone || "",
      address: s.address || "",
      payment_terms: s.payment_terms,
      default_lead_time_days: s.default_lead_time_days,
    });
    setShowForm(true);
  }

  /* ── save product ────────────────────────────────────────────────── */

  async function saveProduct() {
    if (!expandedId) return;
    setSavingProduct(true);
    try {
      const res = await fetch("/api/supply-pos/supplier-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...productForm, supplier_id: expandedId }),
      });
      if (res.ok) {
        setShowProductForm(false);
        setProductForm(blankProduct);
        fetchProducts(expandedId);
      }
    } catch (err) {
      console.error("Failed to save product:", err);
    } finally {
      setSavingProduct(false);
    }
  }

  /* ── render ──────────────────────────────────────────────────────── */

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div>
            <Link
              href="/supply-pos"
              className="text-xs text-slate-500 hover:text-white mb-2 inline-block"
            >
              &larr; Back to POs
            </Link>
            <h1 className="text-2xl font-bold text-white">Suppliers</h1>
            <p className="text-slate-400 text-sm mt-1">
              Manage your manufacturers and suppliers, plus their product
              catalogs.
            </p>
          </div>
          <button
            onClick={() => {
              setEditingId(null);
              setForm(blankSupplier);
              setShowForm(true);
            }}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 shrink-0"
          >
            + Add Supplier
          </button>
        </div>

        {/* ── Supplier Form (create / edit) ──────────────────────────── */}

        {showForm && (
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-5 mb-6">
            <h2 className="text-sm font-semibold text-white mb-4">
              {editingId ? "Edit Supplier" : "New Supplier"}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-500">
                  Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. ABC Manufacturing"
                  className="mt-1 w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Code</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="e.g. ABC"
                  className="mt-1 w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Contact Name</label>
                <input
                  type="text"
                  value={form.contact_name}
                  onChange={(e) =>
                    setForm({ ...form, contact_name: e.target.value })
                  }
                  placeholder="John Smith"
                  className="mt-1 w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Contact Email</label>
                <input
                  type="email"
                  value={form.contact_email}
                  onChange={(e) =>
                    setForm({ ...form, contact_email: e.target.value })
                  }
                  placeholder="john@supplier.com"
                  className="mt-1 w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Contact Phone</label>
                <input
                  type="text"
                  value={form.contact_phone}
                  onChange={(e) =>
                    setForm({ ...form, contact_phone: e.target.value })
                  }
                  placeholder="(555) 123-4567"
                  className="mt-1 w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Payment Terms</label>
                <select
                  value={form.payment_terms}
                  onChange={(e) =>
                    setForm({ ...form, payment_terms: e.target.value })
                  }
                  className="mt-1 w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="Net 15">Net 15</option>
                  <option value="Net 30">Net 30</option>
                  <option value="Net 45">Net 45</option>
                  <option value="Net 60">Net 60</option>
                  <option value="Due on Receipt">Due on Receipt</option>
                  <option value="50% Deposit">50% Deposit</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500">
                  Default Lead Time (days)
                </label>
                <input
                  type="number"
                  value={form.default_lead_time_days}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      default_lead_time_days: parseInt(e.target.value) || 0,
                    })
                  }
                  className="mt-1 w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-slate-500">Address</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  placeholder="123 Factory Rd, City, State 12345"
                  className="mt-1 w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setForm(blankSupplier);
                }}
                className="rounded-md border border-slate-600 px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={saveSupplier}
                disabled={saving || !form.name.trim()}
                className="rounded-md bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Update Supplier"
                    : "Create Supplier"}
              </button>
            </div>
          </div>
        )}

        {/* ── Suppliers List ─────────────────────────────────────────── */}

        {loading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-slate-800 rounded-lg" />
            ))}
          </div>
        ) : suppliers.length === 0 ? (
          <div className="text-center py-16">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-800">
              <svg
                className="h-8 w-8 text-slate-500"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125v-2.625M2.25 14.25V6.375c0-.621.504-1.125 1.125-1.125h7.5c.621 0 1.125.504 1.125 1.125v8.25m0-8.25h4.875c.621 0 1.125.504 1.125 1.125v3.659M18 10.5h.008v.008H18V10.5z"
                />
              </svg>
            </div>
            <h3 className="text-white font-medium mb-1">No suppliers yet</h3>
            <p className="text-slate-500 text-sm mb-4">
              Add your first supplier to start creating purchase orders.
            </p>
            <button
              onClick={() => {
                setEditingId(null);
                setForm(blankSupplier);
                setShowForm(true);
              }}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
            >
              + Add Supplier
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {suppliers.map((s) => (
              <div
                key={s.id}
                className="rounded-lg border border-slate-700 bg-slate-800 overflow-hidden"
              >
                {/* Supplier row */}
                <div className="flex items-center justify-between px-4 py-3">
                  <button
                    onClick={() => toggleExpand(s.id)}
                    className="flex-1 text-left min-w-0"
                  >
                    <div className="flex items-center gap-2">
                      <svg
                        className={`h-4 w-4 text-slate-500 transition-transform ${
                          expandedId === s.id ? "rotate-90" : ""
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8.25 4.5l7.5 7.5-7.5 7.5"
                        />
                      </svg>
                      <span className="text-sm font-medium text-white">
                        {s.name}
                      </span>
                      {s.code && (
                        <span className="rounded bg-slate-700 px-1.5 py-0.5 text-xs text-slate-400 font-mono">
                          {s.code}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 ml-6 text-xs text-slate-500">
                      {s.contact_name && <span>{s.contact_name}</span>}
                      {s.contact_email && <span>{s.contact_email}</span>}
                      <span>{s.payment_terms}</span>
                      <span>{s.default_lead_time_days}d lead</span>
                    </div>
                  </button>
                  <button
                    onClick={() => openEditForm(s)}
                    className="shrink-0 rounded-md border border-slate-600 px-2.5 py-1 text-xs text-slate-400 hover:text-white hover:border-slate-500"
                  >
                    Edit
                  </button>
                </div>

                {/* Expanded: Product catalog */}
                {expandedId === s.id && (
                  <div className="border-t border-slate-700 bg-slate-850 px-4 py-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Product Catalog
                      </h3>
                      <button
                        onClick={() => {
                          setProductForm(blankProduct);
                          setShowProductForm(true);
                        }}
                        className="rounded-md border border-dashed border-slate-600 px-2.5 py-1 text-xs text-slate-400 hover:border-slate-500 hover:text-white"
                      >
                        + Add Product
                      </button>
                    </div>

                    {/* Add product form */}
                    {showProductForm && (
                      <div className="rounded-lg border border-slate-600 bg-slate-800 p-4 mb-3">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="text-xs text-slate-500">
                              SKU <span className="text-red-400">*</span>
                            </label>
                            <input
                              type="text"
                              value={productForm.sku}
                              onChange={(e) =>
                                setProductForm({
                                  ...productForm,
                                  sku: e.target.value,
                                })
                              }
                              placeholder="BF-WHEY-VAN-5"
                              className="mt-1 w-full rounded-md border border-slate-600 bg-slate-700 px-2 py-1.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-500">
                              Supplier SKU
                            </label>
                            <input
                              type="text"
                              value={productForm.supplier_sku}
                              onChange={(e) =>
                                setProductForm({
                                  ...productForm,
                                  supplier_sku: e.target.value,
                                })
                              }
                              placeholder="SUP-12345"
                              className="mt-1 w-full rounded-md border border-slate-600 bg-slate-700 px-2 py-1.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-500">
                              Product Name
                            </label>
                            <input
                              type="text"
                              value={productForm.product_name}
                              onChange={(e) =>
                                setProductForm({
                                  ...productForm,
                                  product_name: e.target.value,
                                })
                              }
                              placeholder="Whey Protein Vanilla 5lb"
                              className="mt-1 w-full rounded-md border border-slate-600 bg-slate-700 px-2 py-1.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-500">
                              Unit Cost ($)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={productForm.unit_cost_cents / 100 || ""}
                              onChange={(e) =>
                                setProductForm({
                                  ...productForm,
                                  unit_cost_cents: Math.round(
                                    parseFloat(e.target.value || "0") * 100
                                  ),
                                })
                              }
                              placeholder="12.50"
                              className="mt-1 w-full rounded-md border border-slate-600 bg-slate-700 px-2 py-1.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-500">
                              MOQ
                            </label>
                            <input
                              type="number"
                              value={productForm.moq}
                              onChange={(e) =>
                                setProductForm({
                                  ...productForm,
                                  moq: parseInt(e.target.value) || 1,
                                })
                              }
                              className="mt-1 w-full rounded-md border border-slate-600 bg-slate-700 px-2 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-500">
                              Case Pack
                            </label>
                            <input
                              type="number"
                              value={productForm.case_pack}
                              onChange={(e) =>
                                setProductForm({
                                  ...productForm,
                                  case_pack: parseInt(e.target.value) || 1,
                                })
                              }
                              className="mt-1 w-full rounded-md border border-slate-600 bg-slate-700 px-2 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-3">
                          <button
                            onClick={() => {
                              setShowProductForm(false);
                              setProductForm(blankProduct);
                            }}
                            className="rounded-md border border-slate-600 px-2.5 py-1 text-xs text-slate-400 hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={saveProduct}
                            disabled={
                              savingProduct || !productForm.sku.trim()
                            }
                            className="rounded-md bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                          >
                            {savingProduct ? "Saving..." : "Add Product"}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Product list */}
                    {loadingProducts ? (
                      <div className="animate-pulse space-y-2">
                        {[1, 2].map((i) => (
                          <div
                            key={i}
                            className="h-10 bg-slate-700/50 rounded"
                          />
                        ))}
                      </div>
                    ) : products.length === 0 ? (
                      <p className="text-xs text-slate-500 py-2">
                        No products in catalog. Add products to quick-fill PO
                        line items.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-slate-500 border-b border-slate-700">
                              <th className="text-left py-1.5 pr-3">SKU</th>
                              <th className="text-left py-1.5 pr-3">
                                Supplier SKU
                              </th>
                              <th className="text-left py-1.5 pr-3">
                                Product
                              </th>
                              <th className="text-right py-1.5 pr-3">
                                Unit Cost
                              </th>
                              <th className="text-right py-1.5 pr-3">MOQ</th>
                              <th className="text-right py-1.5">
                                Case Pack
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {products.map((p) => (
                              <tr
                                key={p.id}
                                className="border-b border-slate-700/30"
                              >
                                <td className="py-1.5 pr-3 font-mono text-indigo-400">
                                  {p.sku}
                                </td>
                                <td className="py-1.5 pr-3 text-slate-400">
                                  {p.supplier_sku || "—"}
                                </td>
                                <td className="py-1.5 pr-3 text-slate-300">
                                  {p.product_name || "—"}
                                </td>
                                <td className="py-1.5 pr-3 text-right text-white">
                                  {p.unit_cost_cents
                                    ? `$${(p.unit_cost_cents / 100).toFixed(2)}`
                                    : "—"}
                                </td>
                                <td className="py-1.5 pr-3 text-right text-slate-400">
                                  {p.moq}
                                </td>
                                <td className="py-1.5 text-right text-slate-400">
                                  {p.case_pack}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
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
  );
}
