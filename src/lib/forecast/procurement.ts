/**
 * PURE FUNCTIONS for procurement suggestion calculation.
 *
 * CRITICAL FORMULA:
 *   required = demand_units_60 + safety_stock - (available_units + on_order_units)
 *   if required > 0:
 *     order_units = ceil(max(required, moq) / case_pack) * case_pack
 *     suggested_order_date = today + lead_time_days - 7 (buffer)
 */

import type { ProcurementInput } from "./types";

/**
 * Round up to the nearest case pack multiple.
 * roundUpToCasePack(17, 12) → 24
 * roundUpToCasePack(24, 12) → 24
 */
export function roundUpToCasePack(units: number, casePack: number): number {
  if (casePack <= 0) return units;
  return Math.ceil(units / casePack) * casePack;
}

/**
 * Compute required units to order.
 * required = demand_60 + safety_stock - (available + on_order)
 */
export function computeRequired(input: {
  demand_units_60: number;
  safety_stock_units: number;
  available_units: number;
  on_order_units: number;
}): number {
  const required =
    input.demand_units_60 +
    input.safety_stock_units -
    (input.available_units + input.on_order_units);
  return Math.max(required, 0);
}

/**
 * Calculate suggested order quantity, rounded up to MOQ and case pack.
 */
export function suggestedOrderUnits(input: ProcurementInput): number {
  const required = computeRequired({
    demand_units_60: input.demand_units_60,
    safety_stock_units: input.safety_stock_units,
    available_units: input.available_units,
    on_order_units: input.on_order_units,
  });

  if (required <= 0) return 0;

  // Enforce MOQ
  const afterMOQ = Math.max(required, input.moq_units);

  // Round up to case pack
  return roundUpToCasePack(afterMOQ, input.case_pack);
}

/**
 * Calculate suggested order date: today + lead_time - 7 days buffer.
 */
export function suggestedOrderDate(
  leadTimeDays: number,
  bufferDays = 7
): string {
  const date = new Date();
  date.setDate(date.getDate() + leadTimeDays - bufferDays);
  return date.toISOString().split("T")[0];
}

/**
 * Full procurement suggestion for a SKU.
 */
export function computeProcurementSuggestion(input: ProcurementInput): {
  required: number;
  suggested_order_units: number;
  suggested_order_date: string | null;
} {
  const required = computeRequired({
    demand_units_60: input.demand_units_60,
    safety_stock_units: input.safety_stock_units,
    available_units: input.available_units,
    on_order_units: input.on_order_units,
  });

  if (required <= 0) {
    return {
      required: 0,
      suggested_order_units: 0,
      suggested_order_date: null,
    };
  }

  return {
    required,
    suggested_order_units: suggestedOrderUnits(input),
    suggested_order_date: suggestedOrderDate(input.lead_time_days),
  };
}
