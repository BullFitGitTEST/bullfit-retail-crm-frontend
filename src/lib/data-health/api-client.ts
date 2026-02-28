import type { DataHealthSummary } from "./types";

export async function fetchDataHealth(): Promise<DataHealthSummary> {
  const res = await fetch("/api/ops/data-health");
  if (!res.ok) throw new Error("Failed to fetch data health");
  return res.json();
}
