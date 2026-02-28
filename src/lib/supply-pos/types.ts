// ─── Supplier ────────────────────────────────────────────────────────

export interface Supplier {
  id: string;
  name: string;
  code: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  payment_terms: string;
  default_lead_time_days: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupplierProduct {
  id: string;
  supplier_id: string;
  sku: string;
  supplier_sku: string | null;
  product_name: string | null;
  unit_cost_cents: number | null;
  moq: number;
  case_pack: number;
  lead_time_days: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Supply PO ───────────────────────────────────────────────────────

export type POStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "sent"
  | "acknowledged"
  | "in_production"
  | "partially_received"
  | "received"
  | "cancelled";

export interface SupplyPO {
  id: string;
  po_number: string | null;
  supplier_id: string;
  status: POStatus;
  requested_delivery_date: string | null;
  subtotal_cents: number;
  shipping_cents: number;
  tax_cents: number;
  total_cents: number;
  pdf_storage_path: string | null;
  created_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface POLineItem {
  id: string;
  supply_po_id: string;
  sku: string;
  product_name: string | null;
  supplier_sku: string | null;
  quantity: number;
  unit_cost_cents: number;
  total_cents: number;
  received_quantity: number;
  sort_order: number;
  created_at: string;
}

export interface POEvent {
  id: string;
  supply_po_id: string;
  event_type: string;
  actor: string | null;
  notes: string | null;
  metadata_json: Record<string, unknown>;
  created_at: string;
}

// ─── Shipment & Receipt ──────────────────────────────────────────────

export interface Shipment {
  id: string;
  supply_po_id: string;
  carrier: string | null;
  tracking_number: string | null;
  shipped_date: string | null;
  expected_arrival: string | null;
  actual_arrival: string | null;
  status: "in_transit" | "delivered" | "delayed";
  created_at: string;
  updated_at: string;
}

export interface Receipt {
  id: string;
  supply_po_id: string;
  shipment_id: string | null;
  received_at: string;
  received_by: string | null;
  location_id: string | null;
  created_at: string;
}

export interface ReceiptLineItem {
  id: string;
  receipt_id: string;
  supply_po_line_item_id: string;
  sku: string;
  quantity_received: number;
  quantity_damaged: number;
  created_at: string;
}

// ─── Approval & Cost Breakdown ───────────────────────────────────────

export interface Approval {
  id: string;
  supply_po_id: string;
  approver_user_id: string | null;
  status: "pending" | "approved" | "rejected";
  note: string | null;
  requested_at: string;
  approved_at: string | null;
}

export interface CostBreakdown {
  id: string;
  supply_po_id: string;
  cost_type: "freight" | "duties" | "discount" | "other";
  description: string | null;
  amount_cents: number;
  created_at: string;
}

// ─── Enriched types for UI ───────────────────────────────────────────

export interface SupplyPODetail extends SupplyPO {
  supplier: Supplier;
  line_items: POLineItem[];
  events: POEvent[];
  shipments: Shipment[];
}
