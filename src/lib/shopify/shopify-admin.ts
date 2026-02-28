/**
 * Shopify Admin REST API client with rate limiting and pagination.
 *
 * Token resolution order:
 *   1. Encrypted OAuth token from Supabase (ro_shopify_credentials)
 *   2. Fallback to SHOPIFY_ADMIN_API_TOKEN env var
 *
 * Rate limit: 40-request bucket, 2 requests/second leak rate.
 * On 429, exponential backoff with up to 3 retries.
 */

import { supabaseAdmin } from "@/lib/supabase";
import { decryptToken } from "./encryption";

const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || "2024-01";

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

// ─── Dynamic token + domain resolution ──────────────────────────────

let _cachedToken: string | null = null;
let _cachedDomain: string | null = null;
let _cacheExpiry = 0;
const CACHE_TTL_MS = 60_000; // re-check every 60s

/**
 * Resolve Shopify access token:
 *  1. Check Supabase for encrypted OAuth token
 *  2. Fall back to SHOPIFY_ADMIN_API_TOKEN env var
 */
async function resolveCredentials(): Promise<{
  token: string;
  domain: string;
}> {
  const now = Date.now();
  if (_cachedToken && _cachedDomain && now < _cacheExpiry) {
    return { token: _cachedToken, domain: _cachedDomain };
  }

  // Try OAuth credentials from Supabase
  try {
    const { data } = await supabaseAdmin
      .from("ro_shopify_credentials")
      .select("store_domain, encrypted_access_token")
      .limit(1)
      .maybeSingle();

    if (data?.encrypted_access_token && data?.store_domain) {
      const token = decryptToken(data.encrypted_access_token);
      _cachedToken = token;
      _cachedDomain = data.store_domain;
      _cacheExpiry = now + CACHE_TTL_MS;
      return { token, domain: data.store_domain };
    }
  } catch {
    // Table may not exist yet — fall through to env var
  }

  // Fallback to static env vars
  const envToken = process.env.SHOPIFY_ADMIN_API_TOKEN || "";
  const envDomain = process.env.SHOPIFY_STORE_DOMAIN || "";
  _cachedToken = envToken;
  _cachedDomain = envDomain;
  _cacheExpiry = now + CACHE_TTL_MS;
  return { token: envToken, domain: envDomain };
}

/** Invalidate the cached token (e.g. after re-auth). */
export function clearTokenCache() {
  _cachedToken = null;
  _cachedDomain = null;
  _cacheExpiry = 0;
}

async function getBaseUrl(): Promise<string> {
  const { domain } = await resolveCredentials();
  return `https://${domain}/admin/api/${SHOPIFY_API_VERSION}`;
}

async function getHeaders(): Promise<Record<string, string>> {
  const { token } = await resolveCredentials();
  return {
    "X-Shopify-Access-Token": token,
    "Content-Type": "application/json",
  };
}

// Simple rate limiter: 2 req/s
let lastRequestTime = 0;
async function rateLimit() {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < 500) {
    await new Promise((resolve) => setTimeout(resolve, 500 - elapsed));
  }
  lastRequestTime = Date.now();
}

/**
 * Make a single request to Shopify Admin API with retry logic.
 */
async function shopifyFetch<T>(
  path: string,
  options?: RequestInit
): Promise<{ data: T; headers: Headers }> {
  await rateLimit();

  const baseUrl = await getBaseUrl();
  const headers = await getHeaders();

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const url = path.startsWith("http") ? path : `${baseUrl}${path}`;
    const res = await fetch(url, {
      ...options,
      headers: { ...headers, ...(options?.headers || {}) },
    });

    if (res.status === 429) {
      const retryAfter = res.headers.get("Retry-After");
      const delay = retryAfter
        ? parseFloat(retryAfter) * 1000
        : BASE_DELAY_MS * Math.pow(2, attempt);
      console.warn(
        `Shopify 429 rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      continue;
    }

    if (!res.ok) {
      const body = await res.text();
      throw new Error(
        `Shopify API ${res.status}: ${body.slice(0, 500)}`
      );
    }

    const data = (await res.json()) as T;
    return { data, headers: res.headers };
  }

  throw new Error("Shopify API: max retries exceeded (429)");
}

/**
 * Parse Link header for pagination.
 * Returns the "next" URL if present.
 */
function parseNextLink(headers: Headers): string | null {
  const link = headers.get("Link");
  if (!link) return null;

  const parts = link.split(",");
  for (const part of parts) {
    const match = part.match(/<([^>]+)>;\s*rel="next"/);
    if (match) return match[1];
  }
  return null;
}

/**
 * Paginate through all pages of a Shopify list endpoint.
 * `key` is the JSON key that holds the array (e.g., "products", "orders").
 */
export async function shopifyPaginateAll<T>(
  path: string,
  key: string,
  limit = 250
): Promise<T[]> {
  const all: T[] = [];
  let url = `${path}${path.includes("?") ? "&" : "?"}limit=${limit}`;

  while (url) {
    const { data, headers } = await shopifyFetch<Record<string, T[]>>(url);
    const items = data[key] || [];
    all.push(...items);

    const nextUrl = parseNextLink(headers);
    url = nextUrl || "";
  }

  return all;
}

// ─── Typed API calls ─────────────────────────────────────────────────

import type {
  ShopifyProduct,
  ShopifyLocation,
  ShopifyInventoryLevel,
  ShopifyOrder,
} from "./types";

export async function fetchAllProducts(): Promise<ShopifyProduct[]> {
  return shopifyPaginateAll<ShopifyProduct>(
    "/products.json?status=any",
    "products"
  );
}

export async function fetchAllLocations(): Promise<ShopifyLocation[]> {
  const { data } = await shopifyFetch<{ locations: ShopifyLocation[] }>(
    "/locations.json"
  );
  return data.locations || [];
}

export async function fetchInventoryLevels(
  locationIds: number[]
): Promise<ShopifyInventoryLevel[]> {
  const all: ShopifyInventoryLevel[] = [];

  for (const locId of locationIds) {
    const levels = await shopifyPaginateAll<ShopifyInventoryLevel>(
      `/inventory_levels.json?location_ids=${locId}`,
      "inventory_levels"
    );
    all.push(...levels);
  }

  return all;
}

export async function fetchOrders(params: {
  created_at_min?: string;
  created_at_max?: string;
  status?: string;
}): Promise<ShopifyOrder[]> {
  const qs = new URLSearchParams();
  if (params.created_at_min) qs.set("created_at_min", params.created_at_min);
  if (params.created_at_max) qs.set("created_at_max", params.created_at_max);
  qs.set("status", params.status || "any");
  qs.set("financial_status", "paid");

  return shopifyPaginateAll<ShopifyOrder>(
    `/orders.json?${qs.toString()}`,
    "orders"
  );
}

export async function fetchProductsUpdatedSince(
  since: string
): Promise<ShopifyProduct[]> {
  return shopifyPaginateAll<ShopifyProduct>(
    `/products.json?updated_at_min=${since}&status=any`,
    "products"
  );
}
