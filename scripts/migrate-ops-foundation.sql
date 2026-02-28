-- =============================================================================
-- Retail Ops Foundation — Supabase Migration
-- Phase 0: feature_flags, audit_logs, job_runs, permissions, ro_settings
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------------
-- feature_flags — controls module release per feature
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS feature_flags (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flag_key    TEXT NOT NULL UNIQUE,
  is_enabled  BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO feature_flags (flag_key, is_enabled, description) VALUES
  ('shopify_sync', false, 'Shopify product/inventory/sales sync'),
  ('inventory', false, 'Multi-location inventory management'),
  ('forecast', false, 'Demand forecasting engine'),
  ('supply_pos', false, 'Supply purchase orders to manufacturers'),
  ('data_health', false, 'Data quality dashboard'),
  ('ops_runs', false, 'Ops job runs visibility')
ON CONFLICT (flag_key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- audit_logs — tracks all destructive actions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor         TEXT,
  action        TEXT NOT NULL,
  entity_type   TEXT NOT NULL,
  entity_id     UUID,
  before_json   JSONB,
  after_json    JSONB,
  metadata      JSONB DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
  ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created
  ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor
  ON audit_logs(actor);

-- ---------------------------------------------------------------------------
-- job_runs — unified run logging for all background jobs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS job_runs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_type      TEXT NOT NULL,
  module        TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'running'
                CHECK (status IN ('running', 'success', 'failed', 'cancelled')),
  trigger_type  TEXT DEFAULT 'manual'
                CHECK (trigger_type IN ('cron', 'manual', 'webhook')),
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at   TIMESTAMPTZ,
  input_json    JSONB NOT NULL DEFAULT '{}'::jsonb,
  output_json   JSONB NOT NULL DEFAULT '{}'::jsonb,
  error         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_runs_module
  ON job_runs(module);
CREATE INDEX IF NOT EXISTS idx_job_runs_type
  ON job_runs(job_type);
CREATE INDEX IF NOT EXISTS idx_job_runs_status
  ON job_runs(status);
CREATE INDEX IF NOT EXISTS idx_job_runs_started
  ON job_runs(started_at DESC);

-- ---------------------------------------------------------------------------
-- permissions — role-based access control
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS permissions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email  TEXT NOT NULL,
  role        TEXT NOT NULL
              CHECK (role IN ('admin', 'ops_manager', 'buyer_rep', 'finance', 'viewer')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_email)
);

INSERT INTO permissions (user_email, role) VALUES
  ('harrison@bullfit.com', 'admin')
ON CONFLICT (user_email) DO NOTHING;

-- ---------------------------------------------------------------------------
-- ro_settings — key-value settings store by category
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ro_settings (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category    TEXT NOT NULL,
  key         TEXT NOT NULL,
  value       JSONB NOT NULL DEFAULT 'null'::jsonb,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by  TEXT,
  UNIQUE(category, key)
);

-- ---------------------------------------------------------------------------
-- Row-Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ro_settings ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'feature_flags',
      'audit_logs',
      'job_runs',
      'permissions',
      'ro_settings'
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
-- Auto-update updated_at triggers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_feature_flags_updated_at ON feature_flags;
CREATE TRIGGER trg_feature_flags_updated_at
  BEFORE UPDATE ON feature_flags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_permissions_updated_at ON permissions;
CREATE TRIGGER trg_permissions_updated_at
  BEFORE UPDATE ON permissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_ro_settings_updated_at ON ro_settings;
CREATE TRIGGER trg_ro_settings_updated_at
  BEFORE UPDATE ON ro_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
