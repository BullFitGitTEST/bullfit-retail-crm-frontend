/**
 * Build the explanation_json that links all inputs for a forecast SKU line.
 */

import type { ExplanationJson, DemandInput } from "./types";

interface ExplanationInput extends DemandInput {
  demand_30: number;
  demand_60: number;
  demand_90: number;
  trailing_30_day_units: number;
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

export function buildExplanation(input: ExplanationInput): ExplanationJson {
  const dailyAvg =
    input.trailing_30_day_units > 0
      ? Number((input.trailing_30_day_units / 30).toFixed(1))
      : 0;

  return {
    trailing_sales: {
      days: 30,
      total_units: input.trailing_30_day_units,
      daily_avg: dailyAvg,
    },
    opportunity_signals: input.opportunityLines.map((line) => {
      const weight =
        line.probability_override != null
          ? line.probability_override / 100
          : (input.stageWeights[line.stage] ?? 0) / 100;
      return {
        opportunity_id: line.opportunity_id,
        sku: input.sku,
        monthly_units: line.expected_units,
        stage: line.stage,
        weight,
        weighted_units: Math.round(line.expected_units * weight),
      };
    }),
    retailer_po_signals: input.retailerPOLines.map((line) => ({
      retailer_po_id: line.retailer_po_id,
      sku: input.sku,
      quantity_units: line.quantity_units,
      expected_ship_date: line.expected_ship_date,
    })),
    blend_method: "max",
    final_demand_30: input.demand_30,
    final_demand_60: input.demand_60,
    final_demand_90: input.demand_90,
    inventory: input.inventory,
    procurement: input.procurement,
    confidence_factors: input.confidence_factors,
  };
}
