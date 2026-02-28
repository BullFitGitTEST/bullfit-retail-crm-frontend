/**
 * Client-side API wrapper for Supply POs module.
 */

import type {
  Supplier,
  SupplierProduct,
  SupplyPO,
  SupplyPODetail,
} from "./types";

async function poRequest<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`/api/supply-pos${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

// ─── Suppliers ───────────────────────────────────────────────────────

export async function getSuppliers(): Promise<Supplier[]> {
  return poRequest("/suppliers");
}

export async function getSupplier(id: string): Promise<Supplier> {
  return poRequest(`/suppliers/${id}`);
}

export async function createSupplier(
  data: Partial<Supplier>
): Promise<Supplier> {
  return poRequest("/suppliers", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateSupplier(
  id: string,
  data: Partial<Supplier>
): Promise<Supplier> {
  return poRequest(`/suppliers/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// ─── Supplier Products ───────────────────────────────────────────────

export async function getSupplierProducts(params?: {
  supplier_id?: string;
  sku?: string;
}): Promise<SupplierProduct[]> {
  const qs = new URLSearchParams();
  if (params?.supplier_id) qs.set("supplier_id", params.supplier_id);
  if (params?.sku) qs.set("sku", params.sku);
  const query = qs.toString();
  return poRequest(`/supplier-products${query ? `?${query}` : ""}`);
}

// ─── POs ─────────────────────────────────────────────────────────────

export async function getPOs(params?: {
  status?: string;
  supplier_id?: string;
}): Promise<(SupplyPO & { supplier_name: string })[]> {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.supplier_id) qs.set("supplier_id", params.supplier_id);
  const query = qs.toString();
  return poRequest(`/pos${query ? `?${query}` : ""}`);
}

export async function getPO(id: string): Promise<SupplyPODetail> {
  return poRequest(`/pos/${id}`);
}

export async function createPO(data: {
  supplier_id: string;
  requested_delivery_date?: string;
  created_by?: string;
  line_items: Array<{
    sku: string;
    product_name: string;
    supplier_sku?: string;
    quantity: number;
    unit_cost_cents: number;
  }>;
}): Promise<SupplyPO> {
  return poRequest("/pos", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function submitPO(id: string): Promise<void> {
  await poRequest(`/pos/${id}/submit`, { method: "POST" });
}

export async function approvePO(
  id: string,
  approved_by: string
): Promise<void> {
  await poRequest(`/pos/${id}/approve`, {
    method: "POST",
    body: JSON.stringify({ approved_by }),
  });
}

export async function rejectPO(
  id: string,
  note: string
): Promise<void> {
  await poRequest(`/pos/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ note }),
  });
}

export async function sendPO(id: string): Promise<void> {
  await poRequest(`/pos/${id}/send`, { method: "POST" });
}

export async function cancelPO(id: string): Promise<void> {
  await poRequest(`/pos/${id}/cancel`, { method: "POST" });
}
