-- =============================================================================
-- Supply Purchase Orders — Supabase Migration
-- Phase 3: suppliers, POs, line items, events, shipments, receipts, approvals
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------------
-- ro_suppliers — manufacturer/supplier records
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ro_suppliers (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                    TEXT NOT NULL,
  code                    TEXT UNIQUE,
  contact_name            TEXT,
  contact_email           TEXT,
  contact_phone           TEXT,
  address                 TEXT,
  payment_terms           TEXT DEFAULT 'Net 30',
  default_lead_time_days  INT DEFAULT 30,
  is_active               BOOLEAN DEFAULT true,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- ro_supplier_products — supplier-specific SKU pricing/config
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ro_supplier_products (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id       UUID NOT NULL REFERENCES ro_suppliers(id),
  sku               TEXT NOT NULL,
  supplier_sku      TEXT,
  product_name      TEXT,
  unit_cost_cents   INT,
  moq               INT DEFAULT 1,
  case_pack         INT DEFAULT 1,
  lead_time_days    INT,
  is_active         BOOLEAN DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(supplier_id, sku)
);

CREATE INDEX IF NOT EXISTS idx_ro_supplier_products_sku
  ON ro_supplier_products(sku);

-- ---------------------------------------------------------------------------
-- ro_supply_pos — purchase orders TO suppliers
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ro_supply_pos (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  po_number                 TEXT UNIQUE,
  supplier_id               UUID NOT NULL REFERENCES ro_suppliers(id),
  status                    TEXT DEFAULT 'draft'
                            CHECK (status IN (
                              'draft', 'pending_approval', 'approved', 'sent',
                              'acknowledged', 'in_production', 'partially_received',
                              'received', 'cancelled'
                            )),
  requested_delivery_date   DATE,
  subtotal_cents            INT DEFAULT 0,
  shipping_cents            INT DEFAULT 0,
  tax_cents                 INT DEFAULT 0,
  total_cents               INT DEFAULT 0,
  pdf_storage_path          TEXT,
  created_by                TEXT,
  approved_by               TEXT,
  approved_at               TIMESTAMPTZ,
  sent_at                   TIMESTAMPTZ,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ro_supply_pos_status
  ON ro_supply_pos(status);
CREATE INDEX IF NOT EXISTS idx_ro_supply_pos_supplier
  ON ro_supply_pos(supplier_id);

-- ---------------------------------------------------------------------------
-- ro_supply_po_line_items — items on a supply PO
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ro_supply_po_line_items (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supply_po_id        UUID NOT NULL REFERENCES ro_supply_pos(id) ON DELETE CASCADE,
  sku                 TEXT NOT NULL,
  product_name        TEXT,
  supplier_sku        TEXT,
  quantity            INT NOT NULL DEFAULT 0,
  unit_cost_cents     INT DEFAULT 0,
  total_cents         INT DEFAULT 0,
  received_quantity   INT DEFAULT 0,
  sort_order          INT DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ro_supply_po_lines_po
  ON ro_supply_po_line_items(supply_po_id);
CREATE INDEX IF NOT EXISTS idx_ro_supply_po_lines_sku
  ON ro_supply_po_line_items(sku);

-- ---------------------------------------------------------------------------
-- ro_supply_po_events — event timeline for each PO
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ro_supply_po_events (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supply_po_id    UUID NOT NULL REFERENCES ro_supply_pos(id) ON DELETE CASCADE,
  event_type      TEXT NOT NULL,
  actor           TEXT,
  notes           TEXT,
  metadata_json   JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ro_supply_po_events_po
  ON ro_supply_po_events(supply_po_id);

-- ---------------------------------------------------------------------------
-- ro_supply_shipments — shipment tracking for POs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ro_supply_shipments (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supply_po_id        UUID NOT NULL REFERENCES ro_supply_pos(id),
  carrier             TEXT,
  tracking_number     TEXT,
  shipped_date        DATE,
  expected_arrival    DATE,
  actual_arrival      DATE,
  status              TEXT DEFAULT 'in_transit'
                      CHECK (status IN ('in_transit', 'delivered', 'delayed')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ro_supply_shipments_po
  ON ro_supply_shipments(supply_po_id);

-- ---------------------------------------------------------------------------
-- ro_receipts — receiving records
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ro_receipts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supply_po_id    UUID NOT NULL REFERENCES ro_supply_pos(id),
  shipment_id     UUID REFERENCES ro_supply_shipments(id),
  received_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  received_by     TEXT,
  location_id     UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- ro_receipt_line_items — line-level receiving
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ro_receipt_line_items (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  receipt_id              UUID NOT NULL REFERENCES ro_receipts(id) ON DELETE CASCADE,
  supply_po_line_item_id  UUID NOT NULL REFERENCES ro_supply_po_line_items(id),
  sku                     TEXT NOT NULL,
  quantity_received       INT NOT NULL DEFAULT 0,
  quantity_damaged        INT DEFAULT 0,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- ro_supply_po_approvals — approval workflow
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ro_supply_po_approvals (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supply_po_id      UUID NOT NULL REFERENCES ro_supply_pos(id),
  approver_user_id  TEXT,
  status            TEXT DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'rejected')),
  note              TEXT,
  requested_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at       TIMESTAMPTZ
);

-- ---------------------------------------------------------------------------
-- ro_supply_po_cost_breakdown — additional costs on a PO
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ro_supply_po_cost_breakdown (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supply_po_id    UUID NOT NULL REFERENCES ro_supply_pos(id) ON DELETE CASCADE,
  cost_type       TEXT NOT NULL CHECK (cost_type IN ('freight', 'duties', 'discount', 'other')),
  description     TEXT,
  amount_cents    INT DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- ro_settings_finance — finance-related settings
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ro_settings_finance (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL DEFAULT 'null'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO ro_settings_finance (key, value) VALUES
  ('po_approval_threshold_cents', '500000'::jsonb),
  ('default_payment_terms', '"Net 30"'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Row-Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE ro_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ro_supplier_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE ro_supply_pos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ro_supply_po_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ro_supply_po_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ro_supply_shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ro_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ro_receipt_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ro_supply_po_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ro_supply_po_cost_breakdown ENABLE ROW LEVEL SECURITY;
ALTER TABLE ro_settings_finance ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'ro_suppliers',
      'ro_supplier_products',
      'ro_supply_pos',
      'ro_supply_po_line_items',
      'ro_supply_po_events',
      'ro_supply_shipments',
      'ro_receipts',
      'ro_receipt_line_items',
      'ro_supply_po_approvals',
      'ro_supply_po_cost_breakdown',
      'ro_settings_finance'
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
-- Triggers
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_ro_suppliers_updated_at ON ro_suppliers;
CREATE TRIGGER trg_ro_suppliers_updated_at
  BEFORE UPDATE ON ro_suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_ro_supplier_products_updated_at ON ro_supplier_products;
CREATE TRIGGER trg_ro_supplier_products_updated_at
  BEFORE UPDATE ON ro_supplier_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_ro_supply_pos_updated_at ON ro_supply_pos;
CREATE TRIGGER trg_ro_supply_pos_updated_at
  BEFORE UPDATE ON ro_supply_pos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_ro_supply_shipments_updated_at ON ro_supply_shipments;
CREATE TRIGGER trg_ro_supply_shipments_updated_at
  BEFORE UPDATE ON ro_supply_shipments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_ro_settings_finance_updated_at ON ro_settings_finance;
CREATE TRIGGER trg_ro_settings_finance_updated_at
  BEFORE UPDATE ON ro_settings_finance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
