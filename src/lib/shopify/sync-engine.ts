/**
 * Shopify Sync Engine — syncs products, variants, locations, and inventory levels
 * from Shopify Admin API to Supabase.
 *
 * Uses content hashing (SHA-256 of relevant fields) for idempotent upserts.
 * If hash matches, skip upsert. Makes re-runs safe.
 */

import { supabaseAdmin as supabase } from "@/lib/supabase";
import {
  fetchAllProducts,
  fetchProductsUpdatedSince,
  fetchAllLocations,
  fetchInventoryLevels,
} from "./shopify-admin";
import type {
  ShopifyProduct,
  ShopifyVariant,
  SyncResult,
  LocationSyncResult,
  InventorySyncResult,
} from "./types";

// ─── Content hashing ─────────────────────────────────────────────────

async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function productHashInput(p: ShopifyProduct): string {
  return JSON.stringify({
    title: p.title,
    vendor: p.vendor,
    product_type: p.product_type,
    status: p.status,
    tags: p.tags,
  });
}

function variantHashInput(v: ShopifyVariant): string {
  return JSON.stringify({
    sku: v.sku,
    title: v.title,
    price: v.price,
    barcode: v.barcode,
    inventory_item_id: v.inventory_item_id,
  });
}

// ─── Product + Variant Sync ──────────────────────────────────────────

async function syncProducts(
  products: ShopifyProduct[]
): Promise<SyncResult> {
  const result: SyncResult = {
    products_synced: 0,
    variants_synced: 0,
    products_unchanged: 0,
    variants_unchanged: 0,
    errors: [],
  };

  for (const product of products) {
    try {
      const hash = await sha256(productHashInput(product));

      // Check existing hash
      const { data: existing } = await supabase
        .from("ro_shopify_products")
        .select("content_hash")
        .eq("shopify_product_id", product.id)
        .single();

      if (existing?.content_hash === hash) {
        result.products_unchanged++;
      } else {
        const tags =
          typeof product.tags === "string"
            ? product.tags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean)
            : product.tags || [];

        const { error } = await supabase
          .from("ro_shopify_products")
          .upsert(
            {
              shopify_product_id: product.id,
              title: product.title,
              vendor: product.vendor,
              product_type: product.product_type,
              status: product.status,
              tags,
              raw_json: product,
              content_hash: hash,
              synced_at: new Date().toISOString(),
            },
            { onConflict: "shopify_product_id" }
          );

        if (error) {
          result.errors.push(
            `Product ${product.id}: ${error.message}`
          );
        } else {
          result.products_synced++;
        }
      }

      // Sync variants
      for (const variant of product.variants || []) {
        try {
          const vHash = await sha256(variantHashInput(variant));

          const { data: existingV } = await supabase
            .from("ro_shopify_variants")
            .select("content_hash")
            .eq("shopify_variant_id", variant.id)
            .single();

          if (existingV?.content_hash === vHash) {
            result.variants_unchanged++;
          } else {
            const priceCents = variant.price
              ? Math.round(parseFloat(variant.price) * 100)
              : null;

            const { error: vErr } = await supabase
              .from("ro_shopify_variants")
              .upsert(
                {
                  shopify_variant_id: variant.id,
                  shopify_product_id: variant.product_id,
                  sku: variant.sku || null,
                  title: variant.title,
                  price_cents: priceCents,
                  barcode: variant.barcode || null,
                  inventory_item_id: variant.inventory_item_id,
                  raw_json: variant,
                  content_hash: vHash,
                  synced_at: new Date().toISOString(),
                },
                { onConflict: "shopify_variant_id" }
              );

            if (vErr) {
              result.errors.push(
                `Variant ${variant.id}: ${vErr.message}`
              );
            } else {
              result.variants_synced++;
            }
          }
        } catch (vErr) {
          result.errors.push(
            `Variant ${variant.id}: ${vErr instanceof Error ? vErr.message : "unknown"}`
          );
        }
      }
    } catch (pErr) {
      result.errors.push(
        `Product ${product.id}: ${pErr instanceof Error ? pErr.message : "unknown"}`
      );
    }
  }

  return result;
}

// ─── Location Sync ───────────────────────────────────────────────────

async function syncLocations(): Promise<LocationSyncResult> {
  const result: LocationSyncResult = {
    locations_synced: 0,
    locations_unchanged: 0,
    errors: [],
  };

  const locations = await fetchAllLocations();

  for (const loc of locations) {
    try {
      const { error } = await supabase
        .from("ro_shopify_locations")
        .upsert(
          {
            shopify_location_id: loc.id,
            name: loc.name,
            address: loc.address1,
            city: loc.city,
            province: loc.province,
            country: loc.country,
            zip: loc.zip,
            is_active: loc.active,
            synced_at: new Date().toISOString(),
          },
          { onConflict: "shopify_location_id" }
        );

      if (error) {
        result.errors.push(`Location ${loc.id}: ${error.message}`);
      } else {
        result.locations_synced++;
      }
    } catch (err) {
      result.errors.push(
        `Location ${loc.id}: ${err instanceof Error ? err.message : "unknown"}`
      );
    }
  }

  return result;
}

// ─── Inventory Level Sync ────────────────────────────────────────────

async function syncInventoryLevels(): Promise<InventorySyncResult> {
  const result: InventorySyncResult = {
    levels_synced: 0,
    levels_unchanged: 0,
    errors: [],
  };

  // Get all active location IDs from our DB
  const { data: locations } = await supabase
    .from("ro_shopify_locations")
    .select("shopify_location_id")
    .eq("is_active", true);

  if (!locations || locations.length === 0) {
    return result;
  }

  const locationIds = locations.map((l) => l.shopify_location_id);
  const levels = await fetchInventoryLevels(locationIds);

  for (const level of levels) {
    try {
      const { error } = await supabase
        .from("ro_shopify_inventory_levels")
        .upsert(
          {
            shopify_inventory_item_id: level.inventory_item_id,
            shopify_location_id: level.location_id,
            available: level.available,
            updated_at_shopify: level.updated_at || null,
            synced_at: new Date().toISOString(),
          },
          {
            onConflict: "shopify_inventory_item_id,shopify_location_id",
          }
        );

      if (error) {
        result.errors.push(
          `Level ${level.inventory_item_id}@${level.location_id}: ${error.message}`
        );
      } else {
        result.levels_synced++;
      }
    } catch (err) {
      result.errors.push(
        `Level ${level.inventory_item_id}@${level.location_id}: ${err instanceof Error ? err.message : "unknown"}`
      );
    }
  }

  return result;
}

// ─── Public sync functions ───────────────────────────────────────────

export async function runFullSync(): Promise<{
  products: SyncResult;
  locations: LocationSyncResult;
  inventory: InventorySyncResult;
}> {
  const products = await fetchAllProducts();
  const productResult = await syncProducts(products);
  const locationResult = await syncLocations();
  const inventoryResult = await syncInventoryLevels();

  return {
    products: productResult,
    locations: locationResult,
    inventory: inventoryResult,
  };
}

export async function runIncrementalSync(
  since: string
): Promise<{
  products: SyncResult;
  inventory: InventorySyncResult;
}> {
  const products = await fetchProductsUpdatedSince(since);
  const productResult = await syncProducts(products);
  const inventoryResult = await syncInventoryLevels();

  return {
    products: productResult,
    inventory: inventoryResult,
  };
}

export { syncLocations, syncInventoryLevels };
