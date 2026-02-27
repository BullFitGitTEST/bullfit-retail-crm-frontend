-- =============================================================================
-- Competitor Intel — Supabase Migration
-- Creates all ci_* tables for the competitor intelligence module
-- =============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------------
-- ci_competitors — the watchlist
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ci_competitors (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  tags        JSONB NOT NULL DEFAULT '[]'::jsonb,
  priority    TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_by  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- ci_competitor_sources — URLs to monitor per competitor
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ci_competitor_sources (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competitor_id   UUID NOT NULL REFERENCES ci_competitors(id) ON DELETE CASCADE,
  source_type     TEXT NOT NULL CHECK (source_type IN (
    'website_pdp', 'website_collection', 'pricing_page',
    'amazon_listing', 'instagram', 'tiktok', 'press'
  )),
  url             TEXT NOT NULL,
  fetch_frequency TEXT NOT NULL DEFAULT 'weekly' CHECK (fetch_frequency IN ('daily', 'weekly')),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  notes           TEXT,
  last_fetched_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ci_sources_competitor ON ci_competitor_sources(competitor_id);

-- ---------------------------------------------------------------------------
-- ci_competitor_snapshots — point-in-time page captures
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ci_competitor_snapshots (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competitor_id           UUID NOT NULL REFERENCES ci_competitors(id) ON DELETE CASCADE,
  source_id               UUID NOT NULL REFERENCES ci_competitor_sources(id) ON DELETE CASCADE,
  fetched_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  http_status             INTEGER,
  content_hash            TEXT,
  raw_html_storage_path   TEXT,
  extracted_text          TEXT,
  extraction_status       TEXT NOT NULL DEFAULT 'pending' CHECK (extraction_status IN ('pending', 'success', 'failed')),
  extraction_error        TEXT,
  extracted_json          JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ci_snapshots_competitor ON ci_competitor_snapshots(competitor_id);
CREATE INDEX IF NOT EXISTS idx_ci_snapshots_source ON ci_competitor_snapshots(source_id);
CREATE INDEX IF NOT EXISTS idx_ci_snapshots_fetched ON ci_competitor_snapshots(fetched_at DESC);

-- ---------------------------------------------------------------------------
-- ci_competitor_diffs — changes between consecutive snapshots
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ci_competitor_diffs (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competitor_id     UUID NOT NULL REFERENCES ci_competitors(id) ON DELETE CASCADE,
  source_id         UUID NOT NULL REFERENCES ci_competitor_sources(id) ON DELETE CASCADE,
  from_snapshot_id  UUID NOT NULL REFERENCES ci_competitor_snapshots(id) ON DELETE CASCADE,
  to_snapshot_id    UUID NOT NULL REFERENCES ci_competitor_snapshots(id) ON DELETE CASCADE,
  diff_json         JSONB NOT NULL DEFAULT '{}'::jsonb,
  severity_score    INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ci_diffs_competitor ON ci_competitor_diffs(competitor_id);
CREATE INDEX IF NOT EXISTS idx_ci_diffs_created ON ci_competitor_diffs(created_at DESC);

-- ---------------------------------------------------------------------------
-- ci_competitor_insights — weekly AI-generated insights per competitor
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ci_competitor_insights (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competitor_id   UUID NOT NULL REFERENCES ci_competitors(id) ON DELETE CASCADE,
  period_start    DATE NOT NULL,
  period_end      DATE NOT NULL,
  summary         TEXT NOT NULL DEFAULT '',
  opportunities   JSONB NOT NULL DEFAULT '[]'::jsonb,
  threats         JSONB NOT NULL DEFAULT '[]'::jsonb,
  citations       JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ci_insights_competitor ON ci_competitor_insights(competitor_id);

-- ---------------------------------------------------------------------------
-- ci_competitor_recommendations — actionable items from insights
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ci_competitor_recommendations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competitor_id   UUID NOT NULL REFERENCES ci_competitors(id) ON DELETE CASCADE,
  insight_id      UUID NOT NULL REFERENCES ci_competitor_insights(id) ON DELETE CASCADE,
  period_start    DATE NOT NULL,
  period_end      DATE NOT NULL,
  recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ci_recommendations_competitor ON ci_competitor_recommendations(competitor_id);

-- ---------------------------------------------------------------------------
-- ci_competitor_runs — audit log of all AI / fetch runs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ci_competitor_runs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_type        TEXT NOT NULL CHECK (run_type IN (
    'snapshot_fetch', 'extraction', 'diff',
    'insight_generation', 'recommendation_generation', 'competitor_discovery'
  )),
  competitor_id   UUID REFERENCES ci_competitors(id) ON DELETE SET NULL,
  source_id       UUID REFERENCES ci_competitor_sources(id) ON DELETE SET NULL,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at     TIMESTAMPTZ,
  status          TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('success', 'failed', 'running')),
  model           TEXT,
  prompt_version  TEXT,
  input_json      JSONB NOT NULL DEFAULT '{}'::jsonb,
  output_json     JSONB NOT NULL DEFAULT '{}'::jsonb,
  citations       JSONB NOT NULL DEFAULT '[]'::jsonb,
  compliance_json JSONB NOT NULL DEFAULT '{"passed": true, "flags": []}'::jsonb,
  error           TEXT
);

CREATE INDEX IF NOT EXISTS idx_ci_runs_type ON ci_competitor_runs(run_type);
CREATE INDEX IF NOT EXISTS idx_ci_runs_started ON ci_competitor_runs(started_at DESC);

-- ---------------------------------------------------------------------------
-- Row-Level Security — allow anon key full access (single-user CRM)
-- ---------------------------------------------------------------------------
ALTER TABLE ci_competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE ci_competitor_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE ci_competitor_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE ci_competitor_diffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ci_competitor_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE ci_competitor_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ci_competitor_runs ENABLE ROW LEVEL SECURITY;

-- Policies: allow all operations for anon and authenticated roles
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'ci_competitors',
      'ci_competitor_sources',
      'ci_competitor_snapshots',
      'ci_competitor_diffs',
      'ci_competitor_insights',
      'ci_competitor_recommendations',
      'ci_competitor_runs'
    ])
  LOOP
    EXECUTE format('CREATE POLICY IF NOT EXISTS %I ON %I FOR ALL USING (true) WITH CHECK (true)',
      'allow_all_' || tbl, tbl);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- Auto-update updated_at on ci_competitors
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_ci_competitors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ci_competitors_updated_at ON ci_competitors;
CREATE TRIGGER trg_ci_competitors_updated_at
  BEFORE UPDATE ON ci_competitors
  FOR EACH ROW
  EXECUTE FUNCTION update_ci_competitors_updated_at();
