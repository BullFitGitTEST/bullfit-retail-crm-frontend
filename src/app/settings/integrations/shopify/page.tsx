"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import SettingsNav from "@/components/retail-ops/SettingsNav";
import SyncStatusBadge from "@/components/shopify/SyncStatusBadge";
import type { JobRun } from "@/lib/retail-ops/types";

interface ConnectionStatus {
  connected: boolean;
  store_domain: string | null;
  scopes?: string;
  installed_at?: string;
}

export default function ShopifySettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <div className="animate-pulse text-slate-500 text-sm">Loading...</div>
        </div>
      }
    >
      <ShopifySettingsInner />
    </Suspense>
  );
}

function ShopifySettingsInner() {
  const searchParams = useSearchParams();
  const justConnected = searchParams.get("connected") === "true";
  const errorCode = searchParams.get("error");

  const [connection, setConnection] = useState<ConnectionStatus | null>(null);
  const [shopDomain, setShopDomain] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const [lastSyncs, setLastSyncs] = useState<Record<string, JobRun | null>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [productCount, setProductCount] = useState(0);
  const [variantCount, setVariantCount] = useState(0);
  const [locationCount, setLocationCount] = useState(0);

  useEffect(() => {
    fetchConnectionStatus();
    fetchSyncStatus();
    fetchCounts();
  }, []);

  // ── Connection status ───────────────────────────────────────────────

  async function fetchConnectionStatus() {
    try {
      const res = await fetch("/api/shopify/status");
      if (res.ok) {
        const data = await res.json();
        setConnection(data);
        if (data.store_domain) setShopDomain(data.store_domain);
      }
    } catch {
      setConnection({ connected: false, store_domain: null });
    }
  }

  function handleConnect() {
    if (!shopDomain.trim()) return;
    setConnecting(true);
    // Redirect to the install route which starts the OAuth flow
    window.location.href = `/api/shopify/install?shop=${encodeURIComponent(shopDomain.trim())}`;
  }

  async function handleDisconnect() {
    if (!confirm("Disconnect Shopify? This will remove the stored API token."))
      return;
    setDisconnecting(true);
    try {
      const res = await fetch("/api/shopify/status", { method: "DELETE" });
      if (res.ok) {
        setConnection({ connected: false, store_domain: null });
        setShopDomain("");
      }
    } catch (err) {
      console.error("Disconnect failed:", err);
    } finally {
      setDisconnecting(false);
    }
  }

  // ── Sync status ─────────────────────────────────────────────────────

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

  const errorMessages: Record<string, string> = {
    missing_params: "Missing parameters from Shopify redirect.",
    invalid_state: "Session expired or invalid state. Please try again.",
    invalid_hmac: "Security verification failed. Please try again.",
    server_config: "Server configuration error. Check env vars.",
    token_exchange: "Failed to exchange code for token. Check API credentials.",
    storage: "Failed to store credentials. Check database.",
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-white mb-2">
          Shopify Integration
        </h1>
        <p className="text-slate-400 text-sm mb-6">
          Connect your Shopify store, manage sync schedule, and view data
          mapping.
        </p>

        <SettingsNav />

        {/* Success Banner */}
        {justConnected && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 mb-6">
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 text-emerald-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm font-medium text-emerald-400">
                Shopify connected successfully!
              </span>
              <span className="text-xs text-slate-400">
                Your API token has been securely stored. You can now run syncs.
              </span>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {errorCode && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 mb-6">
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                />
              </svg>
              <span className="text-sm font-medium text-red-400">
                Connection failed
              </span>
              <span className="text-xs text-slate-400">
                {errorMessages[errorCode] || "An unexpected error occurred."}
              </span>
            </div>
          </div>
        )}

        {/* ── Shopify Connection ─────────────────────────────────────── */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">
            Store Connection
          </h2>

          {connection === null ? (
            <div className="animate-pulse h-24 bg-slate-800 rounded-lg" />
          ) : connection.connected ? (
            /* Connected state */
            <div className="rounded-lg border border-emerald-500/20 bg-slate-800 p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                    <svg
                      className="h-6 w-6 text-emerald-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-4.318a4.5 4.5 0 00-6.364-6.364L4.319 6.182a4.5 4.5 0 001.242 7.244"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">
                        Connected
                      </span>
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">
                        Active
                      </span>
                    </div>
                    <span className="text-sm text-indigo-400 font-mono">
                      {connection.store_domain}
                    </span>
                    {connection.installed_at && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        Connected{" "}
                        {new Date(connection.installed_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="rounded-md border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                >
                  {disconnecting ? "Disconnecting..." : "Disconnect"}
                </button>
              </div>
              {connection.scopes && (
                <div className="mt-3 pt-3 border-t border-slate-700">
                  <span className="text-xs text-slate-500">
                    Granted scopes:{" "}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {connection.scopes}
                  </span>
                </div>
              )}
            </div>
          ) : (
            /* Not connected state */
            <div className="rounded-lg border border-slate-700 bg-slate-800 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-700">
                  <svg
                    className="h-6 w-6 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-4.318a4.5 4.5 0 00-6.364-6.364L4.319 6.182a4.5 4.5 0 001.242 7.244"
                    />
                  </svg>
                </div>
                <div>
                  <span className="text-sm font-medium text-white">
                    Not Connected
                  </span>
                  <p className="text-xs text-slate-500">
                    Connect your Shopify store to sync products, inventory, and
                    sales data.
                  </p>
                </div>
              </div>

              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="text-xs text-slate-500 mb-1 block">
                    Store domain
                  </label>
                  <input
                    type="text"
                    value={shopDomain}
                    onChange={(e) => setShopDomain(e.target.value)}
                    placeholder="mystore.myshopify.com"
                    className="w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <button
                  onClick={handleConnect}
                  disabled={connecting || !shopDomain.trim()}
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 whitespace-nowrap"
                >
                  {connecting ? "Connecting..." : "Connect Shopify"}
                </button>
              </div>

              <p className="text-xs text-slate-600 mt-3">
                This will redirect you to Shopify to approve API access. Your
                token will be encrypted and stored securely.
              </p>
            </div>
          )}
        </section>

        {/* Data Counts */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">
            Synced Data
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
                  disabled={syncing !== null || !connection?.connected}
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
                  disabled={syncing !== null || !connection?.connected}
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
                      status={getSyncStatus(lastSyncs.shopify_sales_nightly)}
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
                  disabled={syncing !== null || !connection?.connected}
                  className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50 whitespace-nowrap"
                >
                  {syncing === "sales" ? "Running..." : "Run Initial Load"}
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
