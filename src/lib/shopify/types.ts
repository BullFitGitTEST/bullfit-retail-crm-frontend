// ─── Shopify Admin API types ─────────────────────────────────────────

export interface ShopifyProduct {
  id: number;
  title: string;
  vendor: string;
  product_type: string;
  status: string;
  tags: string;
  variants: ShopifyVariant[];
  created_at: string;
  updated_at: string;
}

export interface ShopifyVariant {
  id: number;
  product_id: number;
  title: string;
  sku: string;
  price: string;
  barcode: string | null;
  inventory_item_id: number;
  inventory_quantity: number;
}

export interface ShopifyLocation {
  id: number;
  name: string;
  address1: string | null;
  city: string | null;
  province: string | null;
  country: string | null;
  zip: string | null;
  active: boolean;
}

export interface ShopifyInventoryLevel {
  inventory_item_id: number;
  location_id: number;
  available: number;
  updated_at: string;
}

export interface ShopifyOrder {
  id: number;
  created_at: string;
  line_items: ShopifyLineItem[];
  financial_status: string;
  fulfillment_status: string | null;
}

export interface ShopifyLineItem {
  id: number;
  variant_id: number | null;
  sku: string;
  quantity: number;
  price: string;
}

// ─── DB row types ────────────────────────────────────────────────────

export interface DBShopifyProduct {
  id: string;
  shopify_product_id: number;
  title: string;
  vendor: string | null;
  product_type: string | null;
  status: string;
  tags: string[];
  raw_json: Record<string, unknown>;
  content_hash: string | null;
  synced_at: string;
  created_at: string;
  updated_at: string;
}

export interface DBShopifyVariant {
  id: string;
  shopify_variant_id: number;
  shopify_product_id: number;
  sku: string | null;
  title: string | null;
  price_cents: number | null;
  barcode: string | null;
  inventory_item_id: number | null;
  raw_json: Record<string, unknown>;
  content_hash: string | null;
  synced_at: string;
  created_at: string;
  updated_at: string;
}

export interface DBShopifyLocation {
  id: string;
  shopify_location_id: number;
  name: string;
  address: string | null;
  city: string | null;
  province: string | null;
  country: string | null;
  zip: string | null;
  is_active: boolean;
  synced_at: string;
  created_at: string;
  updated_at: string;
}

export interface DBShopifyInventoryLevel {
  id: string;
  shopify_inventory_item_id: number;
  shopify_location_id: number;
  available: number;
  updated_at_shopify: string | null;
  synced_at: string;
}

export interface DBShopifySalesDaily {
  id: string;
  shop_date: string;
  sku: string;
  units_sold: number;
  gross_sales_cents: number;
  created_at: string;
}

export interface DBShopifyWebhookEvent {
  id: string;
  topic: string;
  payload: Record<string, unknown>;
  processed_at: string | null;
  status: string;
  created_at: string;
}

// ─── Sync result types ───────────────────────────────────────────────

export interface SyncResult {
  products_synced: number;
  variants_synced: number;
  products_unchanged: number;
  variants_unchanged: number;
  errors: string[];
}

export interface LocationSyncResult {
  locations_synced: number;
  locations_unchanged: number;
  errors: string[];
}

export interface InventorySyncResult {
  levels_synced: number;
  levels_unchanged: number;
  errors: string[];
}

export interface SalesIngestResult {
  days_processed: number;
  rows_upserted: number;
  unknown_skus: number;
  errors: string[];
}
