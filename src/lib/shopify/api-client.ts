/**
 * Client-side API wrapper for Shopify sync module.
 * Calls /api/shopify/* endpoints from the browser.
 */

import type {
  DBShopifyProduct,
  DBShopifyVariant,
  DBShopifyLocation,
  DBShopifyInventoryLevel,
  DBShopifySalesDaily,
} from "./types";

async function shopifyRequest<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`/api/shopify${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

// ─── Products ────────────────────────────────────────────────────────

export async function getProducts(): Promise<
  (DBShopifyProduct & { variants: DBShopifyVariant[] })[]
> {
  return shopifyRequest("/products");
}

// ─── Variants ────────────────────────────────────────────────────────

export async function searchVariants(
  query: string
): Promise<DBShopifyVariant[]> {
  return shopifyRequest(`/variants?q=${encodeURIComponent(query)}`);
}

// ─── Locations ───────────────────────────────────────────────────────

export async function getLocations(): Promise<DBShopifyLocation[]> {
  return shopifyRequest("/locations");
}

// ─── Inventory Levels ────────────────────────────────────────────────

export async function getInventoryLevels(params?: {
  location_id?: string;
  sku?: string;
}): Promise<DBShopifyInventoryLevel[]> {
  const qs = new URLSearchParams();
  if (params?.location_id) qs.set("location_id", params.location_id);
  if (params?.sku) qs.set("sku", params.sku);
  const query = qs.toString();
  return shopifyRequest(`/inventory-levels${query ? `?${query}` : ""}`);
}

// ─── Sales ───────────────────────────────────────────────────────────

export async function getSalesDaily(params?: {
  sku?: string;
  start_date?: string;
  end_date?: string;
}): Promise<DBShopifySalesDaily[]> {
  const qs = new URLSearchParams();
  if (params?.sku) qs.set("sku", params.sku);
  if (params?.start_date) qs.set("start_date", params.start_date);
  if (params?.end_date) qs.set("end_date", params.end_date);
  const query = qs.toString();
  return shopifyRequest(`/sales-daily${query ? `?${query}` : ""}`);
}

// ─── Sync triggers ───────────────────────────────────────────────────

export async function triggerFullSync(): Promise<{ run_id: string }> {
  return shopifyRequest("/sync/full", { method: "POST" });
}

export async function triggerIncrementalSync(): Promise<{ run_id: string }> {
  return shopifyRequest("/sync/incremental", { method: "POST" });
}

export async function triggerSalesSync(params?: {
  days_back?: number;
}): Promise<{ run_id: string }> {
  return shopifyRequest("/sync/sales", {
    method: "POST",
    body: JSON.stringify(params || {}),
  });
}
