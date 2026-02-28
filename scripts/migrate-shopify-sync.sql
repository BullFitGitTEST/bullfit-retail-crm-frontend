-- =============================================================================
-- Shopify Sync & Catalog — Supabase Migration
-- Phase 1: products, variants, locations, inventory levels, sales, webhooks
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------------
-- ro_shopify_products — synced product catalog from Shopify
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ro_shopify_products (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shopify_product_id  BIGINT NOT NULL UNIQUE,
  title               TEXT NOT NULL,
  vendor              TEXT,
  product_type        TEXT,
  status              TEXT DEFAULT 'active',
  tags                JSONB DEFAULT '[]'::jsonb,
  raw_json            JSONB DEFAULT '{}'::jsonb,
  content_hash        TEXT,
  synced_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ro_shopify_products_shopify_id
  ON ro_shopify_products(shopify_product_id);

-- ---------------------------------------------------------------------------
-- ro_shopify_variants — synced variants with SKU linkage
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ro_shopify_variants (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shopify_variant_id    BIGINT NOT NULL UNIQUE,
  shopify_product_id    BIGINT NOT NULL,
  sku                   TEXT,
  title                 TEXT,
  price_cents           INT,
  barcode               TEXT,
  inventory_item_id     BIGINT,
  raw_json              JSONB DEFAULT '{}'::jsonb,
  content_hash          TEXT,
  synced_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ro_shopify_variants_sku
  ON ro_shopify_variants(sku);
CREATE INDEX IF NOT EXISTS idx_ro_shopify_variants_product
  ON ro_shopify_variants(shopify_product_id);
CREATE INDEX IF NOT EXISTS idx_ro_shopify_variants_inventory_item
  ON ro_shopify_variants(inventory_item_id);

-- ---------------------------------------------------------------------------
-- ro_shopify_locations — Shopify fulfillment locations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ro_shopify_locations (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shopify_location_id   BIGINT NOT NULL UNIQUE,
  name                  TEXT NOT NULL,
  address               TEXT,
  city                  TEXT,
  province              TEXT,
  country               TEXT,
  zip                   TEXT,
  is_active             BOOLEAN DEFAULT true,
  synced_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- ro_shopify_inventory_levels — per-location inventory
-- Shopify's "available" field = our on_hand source
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ro_shopify_inventory_levels (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shopify_inventory_item_id BIGINT NOT NULL,
  shopify_location_id       BIGINT NOT NULL,
  available                 INT NOT NULL DEFAULT 0,
  updated_at_shopify        TIMESTAMPTZ,
  synced_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(shopify_inventory_item_id, shopify_location_id)
);

CREATE INDEX IF NOT EXISTS idx_ro_inventory_levels_item
  ON ro_shopify_inventory_levels(shopify_inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_ro_inventory_levels_location
  ON ro_shopify_inventory_levels(shopify_location_id);

-- ---------------------------------------------------------------------------
-- ro_shopify_sales_daily — aggregated daily sales by SKU
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ro_shopify_sales_daily (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_date        DATE NOT NULL,
  sku              TEXT NOT NULL,
  units_sold       INT NOT NULL DEFAULT 0,
  gross_sales_cents INT NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(shop_date, sku)
);

CREATE INDEX IF NOT EXISTS idx_ro_sales_daily_sku_date
  ON ro_shopify_sales_daily(sku, shop_date);

-- ---------------------------------------------------------------------------
-- ro_shopify_webhook_events — raw webhook event log
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ro_shopify_webhook_events (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic         TEXT NOT NULL,
  payload       JSONB NOT NULL DEFAULT '{}'::jsonb,
  processed_at  TIMESTAMPTZ,
  status        TEXT DEFAULT 'pending',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ro_webhook_events_topic
  ON ro_shopify_webhook_events(topic);
CREATE INDEX IF NOT EXISTS idx_ro_webhook_events_status
  ON ro_shopify_webhook_events(status);

-- ---------------------------------------------------------------------------
-- Row-Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE ro_shopify_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE ro_shopify_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE ro_shopify_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ro_shopify_inventory_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE ro_shopify_sales_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE ro_shopify_webhook_events ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'ro_shopify_products',
      'ro_shopify_variants',
      'ro_shopify_locations',
      'ro_shopify_inventory_levels',
      'ro_shopify_sales_daily',
      'ro_shopify_webhook_events'
    ])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'allow_all_' || tbl, tbl);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR ALL USING (true) WITH CHECK (true)',
      'allow_all_' || tbl, tbl
    );
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- Auto-update updated_at triggers (for tables with updated_at)
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_ro_shopify_products_updated_at ON ro_shopify_products;
CREATE TRIGGER trg_ro_shopify_products_updated_at
  BEFORE UPDATE ON ro_shopify_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_ro_shopify_variants_updated_at ON ro_shopify_variants;
CREATE TRIGGER trg_ro_shopify_variants_updated_at
  BEFORE UPDATE ON ro_shopify_variants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_ro_shopify_locations_updated_at ON ro_shopify_locations;
CREATE TRIGGER trg_ro_shopify_locations_updated_at
  BEFORE UPDATE ON ro_shopify_locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
