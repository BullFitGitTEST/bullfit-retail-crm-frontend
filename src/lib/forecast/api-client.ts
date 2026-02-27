/**
 * Client-side API wrapper for Forecast module.
 */

import type {
  ForecastRun,
  ForecastSkuLine,
  ForecastAccuracy,
  OpportunitySkuLine,
  StageWeight,
} from "./types";

async function forecastRequest<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`/api/forecast${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

// ─── Runs ────────────────────────────────────────────────────────────

export async function getForecastRuns(): Promise<ForecastRun[]> {
  return forecastRequest("/runs");
}

export async function getForecastRun(
  id: string
): Promise<ForecastRun & { sku_lines: ForecastSkuLine[] }> {
  return forecastRequest(`/runs/${id}`);
}

export async function triggerForecastRun(): Promise<{ run_id: string }> {
  return forecastRequest("/run/daily", { method: "POST" });
}

// ─── SKU Lines ───────────────────────────────────────────────────────

export async function getLatestForecastLines(params?: {
  sku?: string;
}): Promise<ForecastSkuLine[]> {
  const qs = params?.sku ? `?sku=${encodeURIComponent(params.sku)}` : "";
  return forecastRequest(`/sku-lines${qs}`);
}

// ─── Opportunity SKU Lines ───────────────────────────────────────────

export async function getOppSkuLines(params?: {
  opportunity_id?: string;
  sku?: string;
}): Promise<OpportunitySkuLine[]> {
  const qs = new URLSearchParams();
  if (params?.opportunity_id)
    qs.set("opportunity_id", params.opportunity_id);
  if (params?.sku) qs.set("sku", params.sku);
  const query = qs.toString();
  return forecastRequest(
    `/opportunity-sku-lines${query ? `?${query}` : ""}`
  );
}

export async function createOppSkuLine(
  data: Partial<OpportunitySkuLine>
): Promise<OpportunitySkuLine> {
  return forecastRequest("/opportunity-sku-lines", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateOppSkuLine(
  id: string,
  data: Partial<OpportunitySkuLine>
): Promise<OpportunitySkuLine> {
  return forecastRequest("/opportunity-sku-lines", {
    method: "PATCH",
    body: JSON.stringify({ id, ...data }),
  });
}

export async function deleteOppSkuLine(id: string): Promise<void> {
  await forecastRequest("/opportunity-sku-lines", {
    method: "DELETE",
    body: JSON.stringify({ id }),
  });
}

// ─── Accuracy ────────────────────────────────────────────────────────

export async function getForecastAccuracy(params?: {
  sku?: string;
}): Promise<ForecastAccuracy[]> {
  const qs = params?.sku ? `?sku=${encodeURIComponent(params.sku)}` : "";
  return forecastRequest(`/accuracy${qs}`);
}

// ─── Stage Weights ───────────────────────────────────────────────────

export async function getStageWeights(): Promise<StageWeight[]> {
  return forecastRequest("/stage-weights");
}

export async function updateStageWeight(
  stage: string,
  probability: number
): Promise<StageWeight> {
  return forecastRequest("/stage-weights", {
    method: "PATCH",
    body: JSON.stringify({ stage, probability }),
  });
}
