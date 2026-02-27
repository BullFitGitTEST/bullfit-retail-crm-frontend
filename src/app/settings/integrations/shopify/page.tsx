"use client";

import { useEffect, useState } from "react";
import SettingsNav from "@/components/retail-ops/SettingsNav";
import SyncStatusBadge from "@/components/shopify/SyncStatusBadge";
import type { JobRun } from "@/lib/retail-ops/types";

export default function ShopifySettingsPage() {
  const [lastSyncs, setLastSyncs] = useState<Record<string, JobRun | null>>({});
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [productCount, setProductCount] = useState(0);
  const [variantCount, setVariantCount] = useState(0);
  const [locationCount, setLocationCount] = useState(0);

  useEffect(() => {
    fetchSyncStatus();
    fetchCounts();
  }, []);

  async function fetchSyncStatus() {
    try {
      const res = await fetch(
        "/api/retail-ops/job-runs?module=shopify&limit=10"
      );
      if (!res.ok) return;
      const runs: JobRun[] = await res.json();

      const types = [
        "shopify_full_sync",
        "shopify_incremental_sync",
        "shopify_sales_nightly",
      ];
      const map: Record<string, JobRun | null> = {};
      for (const type of types) {
        map[type] = runs.find((r) => r.job_type === type) || null;
      }
      setLastSyncs(map);
    } catch (err) {
      console.error("Failed to fetch sync status:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCounts() {
    try {
      const [productsRes, variantsRes, locationsRes] = await Promise.all([
        fetch("/api/shopify/products?limit=1"),
        fetch("/api/shopify/variants?limit=1"),
        fetch("/api/shopify/locations"),
      ]);

      if (productsRes.ok) {
        const products = await productsRes.json();
        setProductCount(products.length);
      }
      if (variantsRes.ok) {
        const variants = await variantsRes.json();
        setVariantCount(variants.length);
      }
      if (locationsRes.ok) {
        const locations = await locationsRes.json();
        setLocationCount(locations.length);
      }
    } catch {
      // ignore
    }
  }

  async function triggerSync(type: "full" | "incremental" | "sales") {
    setSyncing(type);
    try {
      const endpoint = `/api/shopify/sync/${type}`;
      const body =
        type === "sales" ? JSON.stringify({ days_back: 365 }) : undefined;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      if (res.ok) {
        // Refresh status after a brief delay
        setTimeout(() => {
          fetchSyncStatus();
          fetchCounts();
        }, 2000);
      }
    } catch (err) {
      console.error(`Sync ${type} failed:`, err);
    } finally {
      setSyncing(null);
    }
  }

  function getSyncStatus(
    run: JobRun | null | undefined
  ): "success" | "failed" | "running" | "never" {
    if (!run) return "never";
    if (run.status === "running") return "running";
    if (run.status === "success") return "success";
    return "failed";
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-white mb-2">
          Shopify Integration
        </h1>
        <p className="text-slate-400 text-sm mb-6">
          Manage Shopify API connection, sync schedule, and data mapping.
        </p>

        <SettingsNav />

        {/* Connection Status */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">
            Connection Status
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
              <div className="text-xs text-slate-500 mb-1">Products</div>
              <div className="text-xl font-semibold text-white">
                {productCount}
              </div>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
              <div className="text-xs text-slate-500 mb-1">Variants</div>
              <div className="text-xl font-semibold text-white">
                {variantCount}
              </div>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
              <div className="text-xs text-slate-500 mb-1">Locations</div>
              <div className="text-xl font-semibold text-white">
                {locationCount}
              </div>
            </div>
          </div>
        </section>

        {/* Sync Controls */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">
            Sync Controls
          </h2>

          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-slate-800 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Full Sync */}
              <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800 px-4 py-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">
                      Full Product Sync
                    </span>
                    <SyncStatusBadge
                      status={getSyncStatus(lastSyncs.shopify_full_sync)}
                      lastSync={lastSyncs.shopify_full_sync?.finished_at}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Syncs all products, variants, locations, and inventory
                    levels. Runs daily at 2am UTC.
                  </p>
                </div>
                <button
                  onClick={() => triggerSync("full")}
                  disabled={syncing !== null}
                  className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50 whitespace-nowrap"
                >
                  {syncing === "full" ? "Running..." : "Run Now"}
                </button>
              </div>

              {/* Incremental Sync */}
              <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800 px-4 py-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">
                      Incremental Sync
                    </span>
                    <SyncStatusBadge
                      status={getSyncStatus(
                        lastSyncs.shopify_incremental_sync
                      )}
                      lastSync={
                        lastSyncs.shopify_incremental_sync?.finished_at
                      }
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Syncs products updated since last sync + inventory levels.
                    Runs every 2 hours.
                  </p>
                </div>
                <button
                  onClick={() => triggerSync("incremental")}
                  disabled={syncing !== null}
                  className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50 whitespace-nowrap"
                >
                  {syncing === "incremental" ? "Running..." : "Run Now"}
                </button>
              </div>

              {/* Sales Sync */}
              <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800 px-4 py-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">
                      Sales History Ingest
                    </span>
                    <SyncStatusBadge
                      status={getSyncStatus(
                        lastSyncs.shopify_sales_nightly
                      )}
                      lastSync={lastSyncs.shopify_sales_nightly?.finished_at}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Imports order data and aggregates daily sales by SKU. Click
                    to run initial 365-day load.
                  </p>
                </div>
                <button
                  onClick={() => triggerSync("sales")}
                  disabled={syncing !== null}
                  className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50 whitespace-nowrap"
                >
                  {syncing === "sales" ? "Running..." : "Run Initial Load"}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Environment Info */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-4">
            Configuration
          </h2>
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-4 text-xs">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">SHOPIFY_STORE_DOMAIN</span>
                <span className="text-slate-300 font-mono">
                  {process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN ||
                    "Not configured"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">SHOPIFY_API_VERSION</span>
                <span className="text-slate-300 font-mono">2024-01</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">API Token</span>
                <span className="text-slate-300">
                  Set via server environment variable
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
