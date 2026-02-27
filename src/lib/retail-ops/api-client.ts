// =============================================================================
// Retail Ops — Client-side API functions
// =============================================================================

import type {
  FeatureFlag,
  FeatureFlagKey,
  AuditLog,
  JobRun,
  SettingsRow,
  SettingsUpsert,
} from "./types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function roRequest<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`/api/retail-ops${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers as Record<string, string>),
    },
    ...options,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`RO API error ${res.status}: ${body}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Feature Flags
// ---------------------------------------------------------------------------

export async function getFeatureFlags(): Promise<FeatureFlag[]> {
  return roRequest<FeatureFlag[]>("/feature-flags");
}

export async function toggleFeatureFlag(
  flagKey: FeatureFlagKey,
  isEnabled: boolean
): Promise<FeatureFlag> {
  return roRequest<FeatureFlag>("/feature-flags", {
    method: "PATCH",
    body: JSON.stringify({ flag_key: flagKey, is_enabled: isEnabled }),
  });
}

/** Check if a specific feature flag is enabled. Caches for 60 seconds. */
let flagCache: { flags: FeatureFlag[]; cachedAt: number } | null = null;
const FLAG_CACHE_TTL = 60_000;

export async function isFeatureEnabled(
  flagKey: FeatureFlagKey
): Promise<boolean> {
  const now = Date.now();
  if (flagCache && now - flagCache.cachedAt < FLAG_CACHE_TTL) {
    const flag = flagCache.flags.find((f) => f.flag_key === flagKey);
    return flag?.is_enabled ?? false;
  }

  try {
    const flags = await getFeatureFlags();
    flagCache = { flags, cachedAt: now };
    const flag = flags.find((f) => f.flag_key === flagKey);
    return flag?.is_enabled ?? false;
  } catch {
    return false;
  }
}

export function clearFlagCache(): void {
  flagCache = null;
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export async function getSettings(
  category?: string
): Promise<SettingsRow[]> {
  const query = category ? `?category=${encodeURIComponent(category)}` : "";
  return roRequest<SettingsRow[]>(`/settings${query}`);
}

export async function upsertSetting(
  data: SettingsUpsert
): Promise<SettingsRow> {
  return roRequest<SettingsRow>("/settings", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ---------------------------------------------------------------------------
// Job Runs
// ---------------------------------------------------------------------------

export async function getJobRuns(params?: {
  module?: string;
  job_type?: string;
  status?: string;
  limit?: number;
}): Promise<JobRun[]> {
  const searchParams = new URLSearchParams();
  if (params?.module) searchParams.set("module", params.module);
  if (params?.job_type) searchParams.set("job_type", params.job_type);
  if (params?.status) searchParams.set("status", params.status);
  if (params?.limit) searchParams.set("limit", String(params.limit));

  const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
  return roRequest<JobRun[]>(`/job-runs${query}`);
}

export async function getJobRun(id: string): Promise<JobRun> {
  return roRequest<JobRun>(`/job-runs/${id}`);
}

// ---------------------------------------------------------------------------
// Audit Logs
// ---------------------------------------------------------------------------

export async function getAuditLogs(params?: {
  entity_type?: string;
  entity_id?: string;
  limit?: number;
}): Promise<AuditLog[]> {
  const searchParams = new URLSearchParams();
  if (params?.entity_type)
    searchParams.set("entity_type", params.entity_type);
  if (params?.entity_id) searchParams.set("entity_id", params.entity_id);
  if (params?.limit) searchParams.set("limit", String(params.limit));

  const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
  return roRequest<AuditLog[]>(`/audit-logs${query}`);
}
