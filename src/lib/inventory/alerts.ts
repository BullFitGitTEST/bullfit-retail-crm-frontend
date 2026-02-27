/**
 * Inventory alert generation — stockout risk, weeks-of-cover, overstock.
 */

import type { InventoryAlert, AlertSeverity } from "./types";

interface AlertInput {
  sku: string;
  available_units: number;
  on_order_units: number;
  safety_stock_units: number;
  reorder_point_units: number;
  lead_time_days: number;
  trailing_30_day_units: number; // from forecast/sales
}

/**
 * Compute weeks of cover based on trailing velocity.
 */
export function weeksOfCover(
  available: number,
  trailingSales30: number
): number {
  if (trailingSales30 <= 0) return Infinity;
  const weeklyRate = trailingSales30 / 4.33; // ~4.33 weeks in a month
  if (weeklyRate <= 0) return Infinity;
  return available / weeklyRate;
}

/**
 * Generate alerts for a single SKU.
 */
export function generateAlerts(input: AlertInput): InventoryAlert[] {
  const alerts: InventoryAlert[] = [];

  const woc = weeksOfCover(
    input.available_units,
    input.trailing_30_day_units
  );

  // Stockout risk: available is 0 or below safety stock
  if (input.available_units <= 0) {
    alerts.push({
      sku: input.sku,
      alert_type: "stockout_risk",
      severity: "critical",
      message: `${input.sku} is out of stock (0 available units)`,
      data: { available_units: input.available_units, on_order: input.on_order_units },
    });
  } else if (input.available_units <= input.safety_stock_units) {
    alerts.push({
      sku: input.sku,
      alert_type: "stockout_risk",
      severity: "warning",
      message: `${input.sku} is at or below safety stock (${input.available_units} available, safety: ${input.safety_stock_units})`,
      data: {
        available_units: input.available_units,
        safety_stock: input.safety_stock_units,
      },
    });
  }

  // Below reorder point
  if (
    input.reorder_point_units > 0 &&
    input.available_units <= input.reorder_point_units &&
    input.available_units > 0
  ) {
    alerts.push({
      sku: input.sku,
      alert_type: "below_reorder_point",
      severity: "warning",
      message: `${input.sku} is below reorder point (${input.available_units} available, reorder at ${input.reorder_point_units})`,
      data: {
        available_units: input.available_units,
        reorder_point: input.reorder_point_units,
      },
    });
  }

  // Low weeks of cover
  if (woc < 2 && woc !== Infinity && input.available_units > 0) {
    const severity: AlertSeverity = woc < 1 ? "critical" : "warning";
    alerts.push({
      sku: input.sku,
      alert_type: "low_weeks_of_cover",
      severity,
      message: `${input.sku} has only ${woc.toFixed(1)} weeks of cover at current velocity`,
      data: {
        weeks_of_cover: Number(woc.toFixed(1)),
        available_units: input.available_units,
        weekly_velocity: Number(
          (input.trailing_30_day_units / 4.33).toFixed(1)
        ),
      },
    });
  }

  // Overstock: more than 12 weeks of cover
  if (woc > 12 && woc !== Infinity && input.trailing_30_day_units > 0) {
    alerts.push({
      sku: input.sku,
      alert_type: "overstock",
      severity: "info",
      message: `${input.sku} has ${woc.toFixed(0)} weeks of cover — potential overstock`,
      data: {
        weeks_of_cover: Number(woc.toFixed(1)),
        available_units: input.available_units,
      },
    });
  }

  return alerts;
}
