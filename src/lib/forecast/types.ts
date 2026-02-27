// ─── Database row types ──────────────────────────────────────────────

export interface ForecastRun {
  id: string;
  run_type: "daily" | "manual";
  horizon_days: number;
  model_version: string;
  started_at: string;
  finished_at: string | null;
  status: "running" | "success" | "failed";
  input_summary: Record<string, unknown>;
  output_summary: Record<string, unknown>;
  error: string | null;
  created_at: string;
}

export interface ForecastSkuLine {
  id: string;
  forecast_run_id: string;
  sku: string;
  demand_units_30: number;
  demand_units_60: number;
  demand_units_90: number;
  trailing_30_day_units: number;
  weighted_opp_units_30: number;
  retailer_po_units_30: number;
  confidence_30: number;
  confidence_60: number;
  confidence_90: number;
  suggested_order_units: number;
  suggested_order_date: string | null;
  risk_flags: string[];
  explanation_json: ExplanationJson;
  created_at: string;
}

export interface ForecastAccuracy {
  id: string;
  sku: string;
  forecast_run_id: string | null;
  period_start: string;
  period_end: string;
  forecasted_units: number;
  actual_units: number;
  error_units: number;
  error_pct: number;
  created_at: string;
}

export interface OpportunitySkuLine {
  id: string;
  opportunity_id: string;
  sku: string;
  product_name: string | null;
  expected_units: number;
  probability_override: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface StageWeight {
  stage: string;
  probability: number;
  created_at: string;
  updated_at: string;
}

// ─── Explanation JSON structure ──────────────────────────────────────

export interface ExplanationJson {
  trailing_sales: {
    days: number;
    total_units: number;
    daily_avg: number;
  };
  opportunity_signals: Array<{
    opportunity_id: string;
    sku: string;
    monthly_units: number;
    stage: string;
    weight: number;
    weighted_units: number;
  }>;
  retailer_po_signals: Array<{
    retailer_po_id: string;
    sku: string;
    quantity_units: number;
    expected_ship_date: string | null;
  }>;
  blend_method: "max";
  final_demand_30: number;
  final_demand_60: number;
  final_demand_90: number;
  inventory: {
    on_hand: number;
    reserved: number;
    available: number;
    on_order: number;
  };
  procurement: {
    safety_stock: number;
    required: number;
    suggested_order_units: number;
    suggested_order_date: string | null;
  };
  confidence_factors: {
    trailing_stability: number;
    opp_confirmation: number;
    signal_count: number;
  };
}

// ─── Input types for engine ──────────────────────────────────────────

export interface DemandInput {
  sku: string;
  salesHistory: { shop_date: string; units_sold: number }[];
  opportunityLines: {
    opportunity_id: string;
    expected_units: number;
    stage: string;
    probability_override: number | null;
  }[];
  retailerPOLines: {
    retailer_po_id: string;
    quantity_units: number;
    expected_ship_date: string | null;
  }[];
  stageWeights: Record<string, number>;
}

export interface ProcurementInput {
  demand_units_60: number;
  safety_stock_units: number;
  available_units: number;
  on_order_units: number;
  moq_units: number;
  case_pack: number;
  lead_time_days: number;
}
