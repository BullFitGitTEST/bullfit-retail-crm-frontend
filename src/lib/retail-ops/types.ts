// =============================================================================
// Retail Ops — TypeScript Types
// =============================================================================

// ---------------------------------------------------------------------------
// Feature Flags
// ---------------------------------------------------------------------------

export type FeatureFlagKey =
  | "shopify_sync"
  | "inventory"
  | "forecast"
  | "supply_pos"
  | "data_health"
  | "ops_runs";

export interface FeatureFlag {
  id: string;
  flag_key: FeatureFlagKey;
  is_enabled: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Audit Logs
// ---------------------------------------------------------------------------

export interface AuditLog {
  id: string;
  actor: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  before_json: Record<string, unknown> | null;
  after_json: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AuditLogInput {
  actor?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  before_json?: Record<string, unknown>;
  after_json?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Job Runs
// ---------------------------------------------------------------------------

export type JobStatus = "running" | "success" | "failed" | "cancelled";
export type TriggerType = "cron" | "manual" | "webhook";

export interface JobRun {
  id: string;
  job_type: string;
  module: string;
  status: JobStatus;
  trigger_type: TriggerType;
  started_at: string;
  finished_at: string | null;
  input_json: Record<string, unknown>;
  output_json: Record<string, unknown>;
  error: string | null;
  created_at: string;
}

export interface JobRunInput {
  job_type: string;
  module: string;
  trigger_type?: TriggerType;
  input_json?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Permissions / RBAC
// ---------------------------------------------------------------------------

export type UserRole = "admin" | "ops_manager" | "buyer_rep" | "finance" | "viewer";

export interface Permission {
  id: string;
  user_email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export interface SettingsRow {
  id: string;
  category: string;
  key: string;
  value: unknown;
  updated_at: string;
  updated_by: string | null;
}

export interface SettingsUpsert {
  category: string;
  key: string;
  value: unknown;
  updated_by?: string;
}

// ---------------------------------------------------------------------------
// Job Run Helpers
// ---------------------------------------------------------------------------

/** Create a job run row at the start of a job. Returns the run ID. */
export interface StartJobResult {
  run_id: string;
}

/** Update a job run at the end of a job. */
export interface FinishJobInput {
  run_id: string;
  status: "success" | "failed";
  output_json?: Record<string, unknown>;
  error?: string;
}
