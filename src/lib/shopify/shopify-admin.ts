/**
 * Shopify Admin REST API client with rate limiting and pagination.
 *
 * Rate limit: 40-request bucket, 2 requests/second leak rate.
 * On 429, exponential backoff with up to 3 retries.
 */

const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || "";
const SHOPIFY_ADMIN_API_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN || "";
const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || "2024-01";

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

function getBaseUrl(): string {
  return `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}`;
}

function getHeaders(): Record<string, string> {
  return {
    "X-Shopify-Access-Token": SHOPIFY_ADMIN_API_TOKEN,
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

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const url = path.startsWith("http") ? path : `${getBaseUrl()}${path}`;
    const res = await fetch(url, {
      ...options,
      headers: { ...getHeaders(), ...(options?.headers || {}) },
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
