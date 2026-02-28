-- ============================================================
-- Migration 5: Shopify OAuth Credentials (encrypted token storage)
-- ============================================================

-- Stores encrypted Shopify Admin API tokens obtained via OAuth
CREATE TABLE IF NOT EXISTS ro_shopify_credentials (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_domain   TEXT NOT NULL UNIQUE,                       -- e.g. mystore.myshopify.com
  encrypted_access_token TEXT NOT NULL,                      -- AES-256-GCM ciphertext (base64)
  scopes         TEXT,                                        -- comma-separated granted scopes
  installed_at   TIMESTAMPTZ DEFAULT now(),
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE ro_shopify_credentials ENABLE ROW LEVEL SECURITY;

-- Allow-all policy (matches existing pattern)
DROP POLICY IF EXISTS allow_all_ro_shopify_credentials ON ro_shopify_credentials;
CREATE POLICY allow_all_ro_shopify_credentials ON ro_shopify_credentials
  FOR ALL USING (true) WITH CHECK (true);

-- Index on store_domain (already UNIQUE, but explicit for clarity)
CREATE INDEX IF NOT EXISTS idx_shopify_credentials_domain ON ro_shopify_credentials(store_domain);
