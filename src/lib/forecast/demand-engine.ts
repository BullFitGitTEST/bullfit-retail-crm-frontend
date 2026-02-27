/**
 * PURE FUNCTIONS for demand forecasting.
 *
 * CRITICAL — Blended demand model:
 *   trailing_30_day_units = sum(sales last 30 days)
 *   weighted_opp_units_30 = sum(opp.expected_units * stage_weight) for active opps
 *   retailer_po_units_30 = sum(po_line.quantity) for POs expected in 30 days
 *
 *   demand_units_30 = max(trailing, weighted_opp, retailer_po)
 *   (same for 60, 90)
 *
 *   Confidence: high if trailing sales stable AND opps have confirmed dates.
 */

import type { DemandInput } from "./types";

// ─── Trailing velocity ───────────────────────────────────────────────

/**
 * Calculate trailing units sold for a given number of days.
 */
export function trailingVelocity(
  salesHistory: { shop_date: string; units_sold: number }[],
  days: number
): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split("T")[0];

  return salesHistory
    .filter((s) => s.shop_date >= cutoffStr)
    .reduce((sum, s) => sum + s.units_sold, 0);
}

/**
 * Extrapolate trailing velocity to a target period.
 * e.g., 30 days of data → project to 60 days.
 */
export function extrapolateVelocity(
  trailingUnits: number,
  trailingDays: number,
  targetDays: number
): number {
  if (trailingDays <= 0) return 0;
  return Math.round((trailingUnits / trailingDays) * targetDays);
}

// ─── Weighted opportunity demand ─────────────────────────────────────

/**
 * Calculate weighted opportunity demand based on stage weights.
 */
export function weightedOppDemand(
  oppLines: {
    expected_units: number;
    stage: string;
    probability_override: number | null;
  }[],
  stageWeights: Record<string, number>
): number {
  return Math.round(
    oppLines.reduce((sum, line) => {
      const weight =
        line.probability_override != null
          ? line.probability_override / 100
          : (stageWeights[line.stage] ?? 0) / 100;
      return sum + line.expected_units * weight;
    }, 0)
  );
}

// ─── Retailer PO demand ─────────────────────────────────────────────

/**
 * Sum retailer PO quantities expected within a period.
 */
export function retailerPODemand(
  poLines: { quantity_units: number; expected_ship_date: string | null }[],
  withinDays: number
): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + withinDays);
  const cutoffStr = cutoff.toISOString().split("T")[0];

  return poLines
    .filter((l) => {
      if (!l.expected_ship_date) return true; // Include POs with no date
      return l.expected_ship_date <= cutoffStr;
    })
    .reduce((sum, l) => sum + l.quantity_units, 0);
}

// ─── Blended demand ──────────────────────────────────────────────────

/**
 * The blended demand model: max of all signals.
 */
export function blendedDemand(
  trailing: number,
  weightedOpp: number,
  retailerPO: number
): number {
  return Math.max(trailing, weightedOpp, retailerPO);
}

// ─── Confidence scoring ──────────────────────────────────────────────

/**
 * Compute confidence score (0-100) for a given horizon.
 * Higher = more confident.
 */
export function confidenceScore(input: {
  trailingUnits30: number;
  salesDaysWithData: number;
  oppCount: number;
  retailerPOCount: number;
  horizon: 30 | 60 | 90;
}): number {
  let score = 50; // Base

  // Trailing stability (do we have enough data?)
  if (input.salesDaysWithData >= 25) score += 15;
  else if (input.salesDaysWithData >= 15) score += 8;
  else if (input.salesDaysWithData >= 7) score += 3;

  // Trailing volume (non-zero sales = more signal)
  if (input.trailingUnits30 > 0) score += 10;

  // Opportunity signals
  if (input.oppCount > 0) score += 10;
  if (input.oppCount >= 3) score += 5;

  // Retailer PO signals (strongest confidence)
  if (input.retailerPOCount > 0) score += 15;

  // Decay for longer horizons
  if (input.horizon === 60) score -= 10;
  if (input.horizon === 90) score -= 20;

  return Math.max(0, Math.min(100, score));
}

// ─── Full demand calculation ─────────────────────────────────────────

export interface DemandResult {
  demand_units_30: number;
  demand_units_60: number;
  demand_units_90: number;
  trailing_30_day_units: number;
  weighted_opp_units_30: number;
  retailer_po_units_30: number;
  confidence_30: number;
  confidence_60: number;
  confidence_90: number;
}

/**
 * Calculate full demand for a SKU.
 */
export function calculateDemand(input: DemandInput): DemandResult {
  const trailing30 = trailingVelocity(input.salesHistory, 30);
  const trailing60 = extrapolateVelocity(trailing30, 30, 60);
  const trailing90 = extrapolateVelocity(trailing30, 30, 90);

  const oppDemand = weightedOppDemand(
    input.opportunityLines,
    input.stageWeights
  );

  const poDemand30 = retailerPODemand(input.retailerPOLines, 30);
  const poDemand60 = retailerPODemand(input.retailerPOLines, 60);
  const poDemand90 = retailerPODemand(input.retailerPOLines, 90);

  // Blended: max of signals per period
  const demand30 = blendedDemand(trailing30, oppDemand, poDemand30);
  const demand60 = blendedDemand(trailing60, oppDemand, poDemand60);
  const demand90 = blendedDemand(trailing90, oppDemand, poDemand90);

  // Count unique sales days
  const uniqueDays = new Set(
    input.salesHistory.map((s) => s.shop_date)
  ).size;

  const conf30 = confidenceScore({
    trailingUnits30: trailing30,
    salesDaysWithData: uniqueDays,
    oppCount: input.opportunityLines.length,
    retailerPOCount: input.retailerPOLines.length,
    horizon: 30,
  });

  const conf60 = confidenceScore({
    trailingUnits30: trailing30,
    salesDaysWithData: uniqueDays,
    oppCount: input.opportunityLines.length,
    retailerPOCount: input.retailerPOLines.length,
    horizon: 60,
  });

  const conf90 = confidenceScore({
    trailingUnits30: trailing30,
    salesDaysWithData: uniqueDays,
    oppCount: input.opportunityLines.length,
    retailerPOCount: input.retailerPOLines.length,
    horizon: 90,
  });

  return {
    demand_units_30: demand30,
    demand_units_60: demand60,
    demand_units_90: demand90,
    trailing_30_day_units: trailing30,
    weighted_opp_units_30: oppDemand,
    retailer_po_units_30: poDemand30,
    confidence_30: conf30,
    confidence_60: conf60,
    confidence_90: conf90,
  };
}
