/**
 * Sales Ingest — fetches Shopify orders, maps line items to SKUs,
 * aggregates to daily totals, and upserts into ro_shopify_sales_daily.
 *
 * UNKNOWN SKU handling: If a line item has no variant_id or the variant
 * has no SKU, we map to sku='UNKNOWN' and flag it in data health.
 *
 * Initial load: last 365 days. Nightly: last 2 days (overlap for safety).
 */

import { supabaseAdmin as supabase } from "@/lib/supabase";
import { fetchOrders } from "./shopify-admin";
import type { ShopifyOrder, SalesIngestResult } from "./types";

interface DailyAgg {
  [dateAndSku: string]: {
    shop_date: string;
    sku: string;
    units_sold: number;
    gross_sales_cents: number;
  };
}

/**
 * Build a variant_id → SKU lookup from our synced variants table.
 */
async function buildVariantSkuMap(): Promise<Map<number, string>> {
  const map = new Map<number, string>();

  const { data: variants } = await supabase
    .from("ro_shopify_variants")
    .select("shopify_variant_id, sku");

  for (const v of variants || []) {
    if (v.sku) {
      map.set(v.shopify_variant_id, v.sku);
    }
  }

  return map;
}

/**
 * Aggregate orders into daily SKU-level sales rows.
 */
function aggregateOrders(
  orders: ShopifyOrder[],
  variantSkuMap: Map<number, string>
): { agg: DailyAgg; unknownCount: number } {
  const agg: DailyAgg = {};
  let unknownCount = 0;

  for (const order of orders) {
    const orderDate = order.created_at.split("T")[0]; // YYYY-MM-DD

    for (const item of order.line_items) {
      let sku: string;

      if (item.sku && item.sku.trim()) {
        sku = item.sku.trim();
      } else if (item.variant_id && variantSkuMap.has(item.variant_id)) {
        sku = variantSkuMap.get(item.variant_id)!;
      } else {
        sku = "UNKNOWN";
        unknownCount++;
      }

      const key = `${orderDate}|${sku}`;
      if (!agg[key]) {
        agg[key] = {
          shop_date: orderDate,
          sku,
          units_sold: 0,
          gross_sales_cents: 0,
        };
      }

      agg[key].units_sold += item.quantity;
      agg[key].gross_sales_cents += Math.round(
        parseFloat(item.price) * 100 * item.quantity
      );
    }
  }

  return { agg, unknownCount };
}

/**
 * Upsert aggregated daily sales rows into Supabase.
 */
async function upsertSalesRows(
  agg: DailyAgg
): Promise<{ upserted: number; errors: string[] }> {
  const rows = Object.values(agg);
  const errors: string[] = [];
  let upserted = 0;

  // Batch upsert in chunks of 100
  const BATCH_SIZE = 100;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);

    const { error } = await supabase
      .from("ro_shopify_sales_daily")
      .upsert(batch, { onConflict: "shop_date,sku" });

    if (error) {
      errors.push(`Batch ${i}: ${error.message}`);
    } else {
      upserted += batch.length;
    }
  }

  return { upserted, errors };
}

// ─── Public API ──────────────────────────────────────────────────────

/**
 * Run sales ingest for a date range.
 * @param daysBack Number of days to look back (default: 2 for nightly, 365 for initial)
 */
export async function runSalesIngest(
  daysBack = 2
): Promise<SalesIngestResult> {
  const result: SalesIngestResult = {
    days_processed: daysBack,
    rows_upserted: 0,
    unknown_skus: 0,
    errors: [],
  };

  try {
    const variantSkuMap = await buildVariantSkuMap();

    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - daysBack);

    const orders = await fetchOrders({
      created_at_min: startDate.toISOString(),
      created_at_max: now.toISOString(),
    });

    const { agg, unknownCount } = aggregateOrders(orders, variantSkuMap);
    result.unknown_skus = unknownCount;

    const { upserted, errors } = await upsertSalesRows(agg);
    result.rows_upserted = upserted;
    result.errors.push(...errors);
  } catch (err) {
    result.errors.push(
      err instanceof Error ? err.message : "Unknown error"
    );
  }

  return result;
}

/**
 * Run initial full sales history load (365 days).
 */
export async function runInitialSalesLoad(): Promise<SalesIngestResult> {
  return runSalesIngest(365);
}
