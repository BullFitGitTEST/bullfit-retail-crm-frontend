// =============================================================================
// Competitor Intel — Client-side API functions
// =============================================================================
// These call the Next.js route handlers at /api/competitor-intel/*

import type {
  Competitor,
  CompetitorWithStats,
  CompetitorSource,
  CompetitorSnapshot,
  CompetitorDiff,
  CompetitorInsight,
  CompetitorRecommendation,
  CompetitorRun,
  CompetitorInput,
  SourceInput,
  RecommendationItem,
  WeeklyRecommendationView,
  SnapshotWithDetails,
  DiscoverCompetitorsInput,
  CompetitorSuggestion,
} from "./types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function ciRequest<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`/api/competitor-intel${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers as Record<string, string>),
    },
    ...options,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`CI API error ${res.status}: ${body}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Competitors
// ---------------------------------------------------------------------------

export async function getCompetitors(): Promise<CompetitorWithStats[]> {
  return ciRequest<CompetitorWithStats[]>("/competitors");
}

export async function createCompetitor(
  data: CompetitorInput
): Promise<Competitor> {
  return ciRequest<Competitor>("/competitors", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCompetitor(
  id: string,
  data: Partial<CompetitorInput>
): Promise<Competitor> {
  return ciRequest<Competitor>("/competitors", {
    method: "PATCH",
    body: JSON.stringify({ id, ...data }),
  });
}

// ---------------------------------------------------------------------------
// Sources
// ---------------------------------------------------------------------------

export async function getSources(
  competitorId?: string
): Promise<CompetitorSource[]> {
  const query = competitorId ? `?competitor_id=${competitorId}` : "";
  return ciRequest<CompetitorSource[]>(`/sources${query}`);
}

export async function createSource(data: SourceInput): Promise<CompetitorSource> {
  return ciRequest<CompetitorSource>("/sources", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateSource(
  id: string,
  data: Partial<SourceInput>
): Promise<CompetitorSource> {
  return ciRequest<CompetitorSource>("/sources", {
    method: "PATCH",
    body: JSON.stringify({ id, ...data }),
  });
}

export async function deleteSource(id: string): Promise<void> {
  return ciRequest<void>("/sources", {
    method: "DELETE",
    body: JSON.stringify({ id }),
  });
}

// ---------------------------------------------------------------------------
// Snapshots (read from Supabase directly via API route)
// ---------------------------------------------------------------------------

export async function getSnapshots(params?: {
  competitor_id?: string;
  source_type?: string;
  from_date?: string;
  to_date?: string;
}): Promise<SnapshotWithDetails[]> {
  const searchParams = new URLSearchParams();
  if (params?.competitor_id)
    searchParams.set("competitor_id", params.competitor_id);
  if (params?.source_type)
    searchParams.set("source_type", params.source_type);
  if (params?.from_date) searchParams.set("from_date", params.from_date);
  if (params?.to_date) searchParams.set("to_date", params.to_date);

  const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
  return ciRequest<SnapshotWithDetails[]>(`/snapshots${query}`);
}

export async function getSnapshot(id: string): Promise<CompetitorSnapshot> {
  return ciRequest<CompetitorSnapshot>(`/snapshots/${id}`);
}

// ---------------------------------------------------------------------------
// Diffs
// ---------------------------------------------------------------------------

export async function getDiffs(params?: {
  competitor_id?: string;
  from_date?: string;
  to_date?: string;
}): Promise<CompetitorDiff[]> {
  const searchParams = new URLSearchParams();
  if (params?.competitor_id)
    searchParams.set("competitor_id", params.competitor_id);
  if (params?.from_date) searchParams.set("from_date", params.from_date);
  if (params?.to_date) searchParams.set("to_date", params.to_date);

  const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
  return ciRequest<CompetitorDiff[]>(`/diffs${query}`);
}

// ---------------------------------------------------------------------------
// Insights
// ---------------------------------------------------------------------------

export async function getInsights(params?: {
  competitor_id?: string;
}): Promise<CompetitorInsight[]> {
  const query = params?.competitor_id
    ? `?competitor_id=${params.competitor_id}`
    : "";
  return ciRequest<CompetitorInsight[]>(`/insights${query}`);
}

// ---------------------------------------------------------------------------
// Recommendations
// ---------------------------------------------------------------------------

export async function getRecommendations(params?: {
  competitor_id?: string;
  from_date?: string;
  to_date?: string;
}): Promise<WeeklyRecommendationView[]> {
  const searchParams = new URLSearchParams();
  if (params?.competitor_id)
    searchParams.set("competitor_id", params.competitor_id);
  if (params?.from_date) searchParams.set("from_date", params.from_date);
  if (params?.to_date) searchParams.set("to_date", params.to_date);

  const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
  return ciRequest<WeeklyRecommendationView[]>(`/recommendations${query}`);
}

// ---------------------------------------------------------------------------
// Task creation from recommendation
// ---------------------------------------------------------------------------

export async function createTaskFromRecommendation(
  recommendation: RecommendationItem,
  competitorName: string
): Promise<{ task_id: string; title: string; due_date: string }> {
  return ciRequest<{ task_id: string; title: string; due_date: string }>(
    "/tasks/create-from-recommendation",
    {
      method: "POST",
      body: JSON.stringify({
        recommendation,
        competitor_name: competitorName,
      }),
    }
  );
}

// ---------------------------------------------------------------------------
// AI Discovery
// ---------------------------------------------------------------------------

export async function discoverCompetitors(
  input: DiscoverCompetitorsInput
): Promise<{
  run_id: string;
  suggestions: CompetitorSuggestion[];
  market_context: string;
}> {
  return ciRequest("/run/discover-competitors", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// ---------------------------------------------------------------------------
// Run triggers (admin)
// ---------------------------------------------------------------------------

export async function triggerSnapshotFetch(params?: {
  competitor_id?: string;
  source_id?: string;
}): Promise<{ run_id: string; results: unknown[] }> {
  return ciRequest("/run/snapshot-fetch", {
    method: "POST",
    body: JSON.stringify(params || {}),
  });
}

export async function triggerExtraction(params?: {
  snapshot_id?: string;
}): Promise<{ run_id: string; results: unknown[] }> {
  return ciRequest("/run/extract", {
    method: "POST",
    body: JSON.stringify(params || {}),
  });
}

export async function triggerDiff(params?: {
  competitor_id?: string;
}): Promise<{ run_id: string; results: unknown[] }> {
  return ciRequest("/run/diff", {
    method: "POST",
    body: JSON.stringify(params || {}),
  });
}

export async function triggerInsightsWeekly(params?: {
  competitor_id?: string;
}): Promise<{ run_id: string; results: unknown[] }> {
  return ciRequest("/run/insights-weekly", {
    method: "POST",
    body: JSON.stringify(params || {}),
  });
}

export async function triggerRecommendationsWeekly(params?: {
  competitor_id?: string;
  insight_id?: string;
}): Promise<{ run_id: string; results: unknown[] }> {
  return ciRequest("/run/recommendations-weekly", {
    method: "POST",
    body: JSON.stringify(params || {}),
  });
}

// ---------------------------------------------------------------------------
// Runs / Logs
// ---------------------------------------------------------------------------

export async function getRuns(params?: {
  run_type?: string;
  status?: string;
  limit?: number;
}): Promise<CompetitorRun[]> {
  const searchParams = new URLSearchParams();
  if (params?.run_type) searchParams.set("run_type", params.run_type);
  if (params?.status) searchParams.set("status", params.status);
  if (params?.limit) searchParams.set("limit", String(params.limit));

  const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
  return ciRequest<CompetitorRun[]>(`/runs${query}`);
}

export async function getRun(id: string): Promise<CompetitorRun> {
  return ciRequest<CompetitorRun>(`/runs/${id}`);
}
