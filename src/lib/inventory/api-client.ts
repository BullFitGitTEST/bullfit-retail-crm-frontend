/**
 * Client-side API wrapper for Inventory module.
 */

import type {
  ComputedPosition,
  InventoryLocation,
  ReservedInventory,
  ReservedInventoryInput,
  InventoryAlert,
} from "./types";

async function inventoryRequest<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`/api/inventory${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

// ─── Positions ───────────────────────────────────────────────────────

export async function getPositions(params?: {
  sku?: string;
}): Promise<(ComputedPosition & { alerts: InventoryAlert[] })[]> {
  const qs = params?.sku ? `?sku=${encodeURIComponent(params.sku)}` : "";
  return inventoryRequest(`/positions${qs}`);
}

// ─── Locations ───────────────────────────────────────────────────────

export async function getInventoryLocations(): Promise<InventoryLocation[]> {
  return inventoryRequest("/locations");
}

export async function createInventoryLocation(
  data: Partial<InventoryLocation>
): Promise<InventoryLocation> {
  return inventoryRequest("/locations", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateInventoryLocation(
  id: string,
  data: Partial<InventoryLocation>
): Promise<InventoryLocation> {
  return inventoryRequest("/locations", {
    method: "PATCH",
    body: JSON.stringify({ id, ...data }),
  });
}

// ─── Reservations ────────────────────────────────────────────────────

export async function getReservations(params?: {
  sku?: string;
}): Promise<ReservedInventory[]> {
  const qs = params?.sku ? `?sku=${encodeURIComponent(params.sku)}` : "";
  return inventoryRequest(`/reserved${qs}`);
}

export async function createReservation(
  data: ReservedInventoryInput
): Promise<ReservedInventory> {
  return inventoryRequest("/reserved", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateReservation(
  id: string,
  data: Partial<ReservedInventory>
): Promise<ReservedInventory> {
  return inventoryRequest("/reserved", {
    method: "PATCH",
    body: JSON.stringify({ id, ...data }),
  });
}

export async function deactivateReservation(
  id: string
): Promise<ReservedInventory> {
  return inventoryRequest("/reserved", {
    method: "PATCH",
    body: JSON.stringify({ id, is_active: false }),
  });
}

// ─── Snapshot ────────────────────────────────────────────────────────

export async function triggerSnapshot(): Promise<{ run_id: string }> {
  return inventoryRequest("/snapshot", { method: "POST" });
}
