-- =============================================================================
-- Inventory & Forecasting — Supabase Migration
-- Phase 2: product master, inventory positions, reservations, forecasts, accuracy
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------------
-- ro_product_master — procurement fields per SKU
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ro_product_master (
  sku                   TEXT PRIMARY KEY,
  case_pack             INT DEFAULT 1,
  moq_units             INT DEFAULT 1,
  safety_stock_units    INT DEFAULT 0,
  lead_time_days        INT DEFAULT 30,
  reorder_point_units   INT DEFAULT 0,
  default_supplier_id   UUID,
  unit_cost_cents       INT,
  is_active             BOOLEAN DEFAULT true,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- ro_inventory_locations — logical inventory locations mapped to Shopify
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ro_inventory_locations (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                  TEXT NOT NULL,
  location_type         TEXT DEFAULT 'warehouse'
                        CHECK (location_type IN ('3pl', 'warehouse', 'supplier', 'retailer', 'other')),
  shopify_location_id   BIGINT,
  include_in_on_hand    BOOLEAN DEFAULT true,
  include_in_forecast   BOOLEAN DEFAULT true,
  include_in_available  BOOLEAN DEFAULT true,
  is_active             BOOLEAN DEFAULT true,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- ro_inventory_position_snapshots — daily snapshot of inventory by SKU
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ro_inventory_position_snapshots (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  snapshot_date     DATE NOT NULL,
  sku               TEXT NOT NULL,
  on_hand_units     INT NOT NULL DEFAULT 0,
  reserved_units    INT NOT NULL DEFAULT 0,
  available_units   INT NOT NULL DEFAULT 0,
  on_order_units    INT NOT NULL DEFAULT 0,
  in_transit_units  INT NOT NULL DEFAULT 0,
  breakdown_json    JSONB DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(snapshot_date, sku)
);

CREATE INDEX IF NOT EXISTS idx_ro_position_snapshots_sku
  ON ro_inventory_position_snapshots(sku);
CREATE INDEX IF NOT EXISTS idx_ro_position_snapshots_date
  ON ro_inventory_position_snapshots(snapshot_date DESC);

-- ---------------------------------------------------------------------------
-- ro_reserved_inventory — active reservations by SKU
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ro_reserved_inventory (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku             TEXT NOT NULL,
  reason_type     TEXT NOT NULL
                  CHECK (reason_type IN ('retailer_po', 'hold', 'quality', 'allocation')),
  reason_ref      JSONB DEFAULT '{}'::jsonb,
  units           INT NOT NULL,
  is_active       BOOLEAN DEFAULT true,
  expires_at      TIMESTAMPTZ,
  reserved_by     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ro_reserved_sku
  ON ro_reserved_inventory(sku);
CREATE INDEX IF NOT EXISTS idx_ro_reserved_active
  ON ro_reserved_inventory(is_active) WHERE is_active = true;

-- ---------------------------------------------------------------------------
-- ro_opportunity_sku_lines — SKU-level demand signals from CRM opps
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ro_opportunity_sku_lines (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id        UUID NOT NULL,
  sku                   TEXT NOT NULL,
  product_name          TEXT,
  expected_units        INT NOT NULL DEFAULT 0,
  probability_override  NUMERIC,
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ro_opp_sku_lines_opp
  ON ro_opportunity_sku_lines(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_ro_opp_sku_lines_sku
  ON ro_opportunity_sku_lines(sku);

-- ---------------------------------------------------------------------------
-- ro_retailer_pos — purchase orders FROM retailers (demand signals)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ro_retailer_pos (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  retailer_name         TEXT NOT NULL,
  account_id            UUID,
  po_number             TEXT,
  po_date               DATE,
  expected_ship_date    DATE,
  status                TEXT DEFAULT 'open'
                        CHECK (status IN ('open', 'shipped', 'cancelled', 'completed')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- ro_retailer_po_line_items — line items on retailer POs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ro_retailer_po_line_items (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  retailer_po_id    UUID NOT NULL REFERENCES ro_retailer_pos(id) ON DELETE CASCADE,
  sku               TEXT NOT NULL,
  quantity_units    INT NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ro_retailer_po_lines_sku
  ON ro_retailer_po_line_items(sku);

-- ---------------------------------------------------------------------------
-- ro_forecast_runs — forecast execution log
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ro_forecast_runs (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_type          TEXT DEFAULT 'daily' CHECK (run_type IN ('daily', 'manual')),
  horizon_days      INT DEFAULT 90,
  model_version     TEXT DEFAULT 'v1-blended-max',
  started_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at       TIMESTAMPTZ,
  status            TEXT DEFAULT 'running'
                    CHECK (status IN ('running', 'success', 'failed')),
  input_summary     JSONB DEFAULT '{}'::jsonb,
  output_summary    JSONB DEFAULT '{}'::jsonb,
  error             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- ro_forecast_sku_lines — per-SKU forecast results
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ro_forecast_sku_lines (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  forecast_run_id         UUID NOT NULL REFERENCES ro_forecast_runs(id) ON DELETE CASCADE,
  sku                     TEXT NOT NULL,
  demand_units_30         INT DEFAULT 0,
  demand_units_60         INT DEFAULT 0,
  demand_units_90         INT DEFAULT 0,
  trailing_30_day_units   INT DEFAULT 0,
  weighted_opp_units_30   INT DEFAULT 0,
  retailer_po_units_30    INT DEFAULT 0,
  confidence_30           INT DEFAULT 50,
  confidence_60           INT DEFAULT 40,
  confidence_90           INT DEFAULT 30,
  suggested_order_units   INT DEFAULT 0,
  suggested_order_date    DATE,
  risk_flags              TEXT[] DEFAULT '{}',
  explanation_json        JSONB DEFAULT '{}'::jsonb,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ro_forecast_lines_run
  ON ro_forecast_sku_lines(forecast_run_id);
CREATE INDEX IF NOT EXISTS idx_ro_forecast_lines_sku
  ON ro_forecast_sku_lines(sku);

-- ---------------------------------------------------------------------------
-- ro_forecast_accuracy — backtest: forecast vs actual
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ro_forecast_accuracy (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku               TEXT NOT NULL,
  forecast_run_id   UUID,
  period_start      DATE NOT NULL,
  period_end        DATE NOT NULL,
  forecasted_units  INT NOT NULL DEFAULT 0,
  actual_units      INT NOT NULL DEFAULT 0,
  error_units       INT NOT NULL DEFAULT 0,
  error_pct         NUMERIC NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ro_forecast_accuracy_sku
  ON ro_forecast_accuracy(sku);

-- ---------------------------------------------------------------------------
-- ro_settings_forecast_stage_weights — pipeline stage → probability mapping
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ro_settings_forecast_stage_weights (
  stage         TEXT PRIMARY KEY,
  probability   INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO ro_settings_forecast_stage_weights (stage, probability) VALUES
  ('targeted', 0),
  ('contact_found', 5),
  ('first_touch', 10),
  ('meeting_booked', 20),
  ('pitch_delivered', 30),
  ('samples_sent', 40),
  ('follow_up', 50),
  ('vendor_setup', 60),
  ('authorization_pending', 70),
  ('po_received', 85),
  ('on_shelf', 95),
  ('reorder_cycle', 100)
ON CONFLICT (stage) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Row-Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE ro_product_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE ro_inventory_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ro_inventory_position_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE ro_reserved_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE ro_opportunity_sku_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE ro_retailer_pos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ro_retailer_po_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ro_forecast_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ro_forecast_sku_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE ro_forecast_accuracy ENABLE ROW LEVEL SECURITY;
ALTER TABLE ro_settings_forecast_stage_weights ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'ro_product_master',
      'ro_inventory_locations',
      'ro_inventory_position_snapshots',
      'ro_reserved_inventory',
      'ro_opportunity_sku_lines',
      'ro_retailer_pos',
      'ro_retailer_po_line_items',
      'ro_forecast_runs',
      'ro_forecast_sku_lines',
      'ro_forecast_accuracy',
      'ro_settings_forecast_stage_weights'
    ])
  LOOP
    EXECUTE format(
      'CREATE POLICY IF NOT EXISTS %I ON %I FOR ALL USING (true) WITH CHECK (true)',
      'allow_all_' || tbl, tbl
    );
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- Auto-update updated_at triggers
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_ro_product_master_updated_at ON ro_product_master;
CREATE TRIGGER trg_ro_product_master_updated_at
  BEFORE UPDATE ON ro_product_master
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_ro_inventory_locations_updated_at ON ro_inventory_locations;
CREATE TRIGGER trg_ro_inventory_locations_updated_at
  BEFORE UPDATE ON ro_inventory_locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_ro_reserved_inventory_updated_at ON ro_reserved_inventory;
CREATE TRIGGER trg_ro_reserved_inventory_updated_at
  BEFORE UPDATE ON ro_reserved_inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_ro_opp_sku_lines_updated_at ON ro_opportunity_sku_lines;
CREATE TRIGGER trg_ro_opp_sku_lines_updated_at
  BEFORE UPDATE ON ro_opportunity_sku_lines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_ro_retailer_pos_updated_at ON ro_retailer_pos;
CREATE TRIGGER trg_ro_retailer_pos_updated_at
  BEFORE UPDATE ON ro_retailer_pos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_ro_stage_weights_updated_at ON ro_settings_forecast_stage_weights;
CREATE TRIGGER trg_ro_stage_weights_updated_at
  BEFORE UPDATE ON ro_settings_forecast_stage_weights
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
