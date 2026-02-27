// ─── Database row types ──────────────────────────────────────────────

export interface ProductMaster {
  sku: string;
  case_pack: number;
  moq_units: number;
  safety_stock_units: number;
  lead_time_days: number;
  reorder_point_units: number;
  default_supplier_id: string | null;
  unit_cost_cents: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryLocation {
  id: string;
  name: string;
  location_type: "3pl" | "warehouse" | "supplier" | "retailer" | "other";
  shopify_location_id: number | null;
  include_in_on_hand: boolean;
  include_in_forecast: boolean;
  include_in_available: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PositionSnapshot {
  id: string;
  snapshot_date: string;
  sku: string;
  on_hand_units: number;
  reserved_units: number;
  available_units: number;
  on_order_units: number;
  in_transit_units: number;
  breakdown_json: Record<string, unknown>;
  created_at: string;
}

export interface ReservedInventory {
  id: string;
  sku: string;
  reason_type: "retailer_po" | "hold" | "quality" | "allocation";
  reason_ref: Record<string, unknown>;
  units: number;
  is_active: boolean;
  expires_at: string | null;
  reserved_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReservedInventoryInput {
  sku: string;
  reason_type: "retailer_po" | "hold" | "quality" | "allocation";
  reason_ref?: Record<string, unknown>;
  units: number;
  expires_at?: string;
  reserved_by?: string;
}

// ─── Computed types ──────────────────────────────────────────────────

export interface ComputedPosition {
  sku: string;
  on_hand_units: number;
  reserved_units: number;
  available_units: number;
  on_order_units: number;
  in_transit_units: number;
  breakdown: LocationBreakdown[];
}

export interface LocationBreakdown {
  location_name: string;
  shopify_location_id: number;
  available: number;
  include_in_on_hand: boolean;
}

// ─── Alerts ──────────────────────────────────────────────────────────

export type AlertSeverity = "critical" | "warning" | "info";

export interface InventoryAlert {
  sku: string;
  alert_type: "stockout_risk" | "low_weeks_of_cover" | "overstock" | "below_reorder_point";
  severity: AlertSeverity;
  message: string;
  data: Record<string, unknown>;
}
