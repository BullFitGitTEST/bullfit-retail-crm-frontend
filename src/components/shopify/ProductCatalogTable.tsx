"use client";

import { useState, useEffect } from "react";
import type { DBShopifyProduct, DBShopifyVariant } from "@/lib/shopify/types";

interface ProductWithVariants extends DBShopifyProduct {
  variants: DBShopifyVariant[];
}

export default function ProductCatalogTable() {
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const res = await fetch("/api/shopify/products");
      if (res.ok) setProducts(await res.json());
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = search
    ? products.filter(
        (p) =>
          p.title.toLowerCase().includes(search.toLowerCase()) ||
          p.variants.some((v) =>
            v.sku?.toLowerCase().includes(search.toLowerCase())
          )
      )
    : products;

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-slate-800 rounded" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search products or SKUs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-sm">
          {products.length === 0
            ? "No products synced yet. Run a full sync to import products from Shopify."
            : "No products match your search."}
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map((product) => (
            <div
              key={product.id}
              className="border border-slate-700 rounded-lg bg-slate-800"
            >
              <button
                onClick={() => toggleExpand(product.id)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-750 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white truncate">
                      {product.title}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-xs ${
                        product.status === "active"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-slate-600/30 text-slate-400"
                      }`}
                    >
                      {product.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
                    {product.vendor && <span>{product.vendor}</span>}
                    <span>{product.variants.length} variants</span>
                  </div>
                </div>
                <svg
                  className={`h-4 w-4 text-slate-400 transition-transform ${
                    expanded.has(product.id) ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {expanded.has(product.id) && product.variants.length > 0 && (
                <div className="border-t border-slate-700 px-4 py-2">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-slate-500">
                        <th className="text-left py-1 font-medium">SKU</th>
                        <th className="text-left py-1 font-medium">Variant</th>
                        <th className="text-right py-1 font-medium">Price</th>
                        <th className="text-left py-1 font-medium">Barcode</th>
                      </tr>
                    </thead>
                    <tbody>
                      {product.variants.map((v) => (
                        <tr
                          key={v.id}
                          className="border-t border-slate-700/50"
                        >
                          <td className="py-1.5 text-indigo-400 font-mono">
                            {v.sku || "—"}
                          </td>
                          <td className="py-1.5 text-slate-300">
                            {v.title}
                          </td>
                          <td className="py-1.5 text-right text-slate-300">
                            {v.price_cents != null
                              ? `$${(v.price_cents / 100).toFixed(2)}`
                              : "—"}
                          </td>
                          <td className="py-1.5 text-slate-500">
                            {v.barcode || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
