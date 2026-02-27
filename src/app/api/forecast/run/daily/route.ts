import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { calculateDemand } from "@/lib/forecast/demand-engine";
import { computeProcurementSuggestion } from "@/lib/forecast/procurement";
import { buildExplanation } from "@/lib/forecast/explanation";

function verifyCron(req: NextRequest): boolean {
  if (!process.env.CRON_SECRET) return true;
  return req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
}

async function executeForecastRun() {
  const startedAt = new Date().toISOString();

  // Create run record
  const { data: run } = await supabase
    .from("ro_forecast_runs")
    .insert({
      run_type: "daily",
      horizon_days: 90,
      model_version: "v1-blended-max",
      started_at: startedAt,
      status: "running",
    })
    .select("id")
    .single();

  const runId = run?.id;

  try {
    // Get stage weights
    const { data: stageWeightRows } = await supabase
      .from("ro_settings_forecast_stage_weights")
      .select("stage, probability");

    const stageWeights: Record<string, number> = {};
    for (const sw of stageWeightRows || []) {
      stageWeights[sw.stage] = sw.probability;
    }

    // Get all active SKUs
    const { data: variants } = await supabase
      .from("ro_shopify_variants")
      .select("sku")
      .not("sku", "is", null);

    const skus = [...new Set((variants || []).map((v) => v.sku).filter(Boolean))];

    // Get 90 days of sales history
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const { data: salesData } = await supabase
      .from("ro_shopify_sales_daily")
      .select("sku, shop_date, units_sold")
      .gte("shop_date", ninetyDaysAgo.toISOString().split("T")[0]);

    // Get opportunity SKU lines with stages
    const { data: oppLines } = await supabase
      .from("ro_opportunity_sku_lines")
      .select("opportunity_id, sku, expected_units, probability_override");

    // Get retailer PO lines
    const { data: retailerPOLines } = await supabase
      .from("ro_retailer_po_line_items")
      .select("retailer_po_id, sku, quantity_units, ro_retailer_pos!inner(expected_ship_date, status)")
      .filter("ro_retailer_pos.status", "eq", "open");

    // Get product master
    const { data: masters } = await supabase
      .from("ro_product_master")
      .select("*");

    const masterMap = new Map(
      (masters || []).map((m) => [m.sku, m])
    );

    // Get inventory positions for procurement calc
    interface PositionData {
      sku: string;
      on_hand_units: number;
      reserved_units: number;
      available_units: number;
      on_order_units: number;
    }
    const posRes = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/inventory/positions`
    );
    const positions: PositionData[] = posRes.ok ? await posRes.json() : [];
    const posMap = new Map<string, PositionData>(
      positions.map((p) => [p.sku, p])
    );

    // Group data by SKU
    const salesBySku = new Map<string, { shop_date: string; units_sold: number }[]>();
    for (const s of salesData || []) {
      const arr = salesBySku.get(s.sku) || [];
      arr.push({ shop_date: s.shop_date, units_sold: s.units_sold });
      salesBySku.set(s.sku, arr);
    }

    const oppBySku = new Map<string, typeof oppLines>();
    for (const o of oppLines || []) {
      const arr = oppBySku.get(o.sku) || [];
      arr.push(o);
      oppBySku.set(o.sku, arr);
    }

    const poBySku = new Map<string, Array<{ retailer_po_id: string; quantity_units: number; expected_ship_date: string | null }>>();
    for (const p of retailerPOLines || []) {
      const arr = poBySku.get(p.sku) || [];
      const poData = p.ro_retailer_pos as unknown as { expected_ship_date: string | null };
      arr.push({
        retailer_po_id: p.retailer_po_id,
        quantity_units: p.quantity_units,
        expected_ship_date: poData?.expected_ship_date || null,
      });
      poBySku.set(p.sku, arr);
    }

    // Calculate forecast for each SKU
    const forecastLines = [];
    let skusProcessed = 0;

    for (const sku of skus) {
      const sales = salesBySku.get(sku) || [];
      const opps = (oppBySku.get(sku) || []).map((o) => ({
        opportunity_id: o.opportunity_id,
        expected_units: o.expected_units,
        stage: "unknown", // TODO: fetch stage from Railway API
        probability_override: o.probability_override,
      }));
      const pos = poBySku.get(sku) || [];

      const demand = calculateDemand({
        sku,
        salesHistory: sales,
        opportunityLines: opps,
        retailerPOLines: pos,
        stageWeights,
      });

      const master = masterMap.get(sku);
      const position: PositionData = posMap.get(sku) || {
        sku,
        on_hand_units: 0,
        reserved_units: 0,
        available_units: 0,
        on_order_units: 0,
      };

      const procurement = computeProcurementSuggestion({
        demand_units_60: demand.demand_units_60,
        safety_stock_units: master?.safety_stock_units || 0,
        available_units: position.available_units || 0,
        on_order_units: position.on_order_units || 0,
        moq_units: master?.moq_units || 1,
        case_pack: master?.case_pack || 1,
        lead_time_days: master?.lead_time_days || 30,
      });

      // Determine risk flags
      const riskFlags: string[] = [];
      if (demand.demand_units_30 > 0 && position.available_units <= 0) {
        riskFlags.push("stockout");
      }
      if (demand.confidence_30 < 30) {
        riskFlags.push("low_confidence");
      }
      if (sales.length === 0) {
        riskFlags.push("no_sales_history");
      }

      // Build explanation
      const uniqueDays = new Set(sales.map((s) => s.shop_date)).size;
      const explanation = buildExplanation({
        sku,
        salesHistory: sales,
        opportunityLines: opps,
        retailerPOLines: pos,
        stageWeights,
        demand_30: demand.demand_units_30,
        demand_60: demand.demand_units_60,
        demand_90: demand.demand_units_90,
        trailing_30_day_units: demand.trailing_30_day_units,
        inventory: {
          on_hand: position.on_hand_units || 0,
          reserved: position.reserved_units || 0,
          available: position.available_units || 0,
          on_order: position.on_order_units || 0,
        },
        procurement: {
          safety_stock: master?.safety_stock_units || 0,
          required: procurement.required,
          suggested_order_units: procurement.suggested_order_units,
          suggested_order_date: procurement.suggested_order_date,
        },
        confidence_factors: {
          trailing_stability: uniqueDays >= 25 ? 0.8 : uniqueDays >= 15 ? 0.5 : 0.2,
          opp_confirmation: opps.length > 0 ? 0.6 : 0,
          signal_count: (sales.length > 0 ? 1 : 0) + (opps.length > 0 ? 1 : 0) + (pos.length > 0 ? 1 : 0),
        },
      });

      forecastLines.push({
        forecast_run_id: runId,
        sku,
        ...demand,
        suggested_order_units: procurement.suggested_order_units,
        suggested_order_date: procurement.suggested_order_date,
        risk_flags: riskFlags,
        explanation_json: explanation,
      });

      skusProcessed++;
    }

    // Batch insert forecast lines
    const BATCH = 100;
    for (let i = 0; i < forecastLines.length; i += BATCH) {
      const batch = forecastLines.slice(i, i + BATCH);
      await supabase.from("ro_forecast_sku_lines").insert(batch);
    }

    // Update run status
    if (runId) {
      await supabase
        .from("ro_forecast_runs")
        .update({
          finished_at: new Date().toISOString(),
          status: "success",
          output_summary: {
            skus_processed: skusProcessed,
            skus_with_demand: forecastLines.filter(
              (l) => l.demand_units_30 > 0
            ).length,
            skus_needing_order: forecastLines.filter(
              (l) => l.suggested_order_units > 0
            ).length,
          },
        })
        .eq("id", runId);
    }

    return NextResponse.json({
      run_id: runId,
      skus_processed: skusProcessed,
      lines_created: forecastLines.length,
    });
  } catch (err) {
    console.error("Forecast run error:", err);

    if (runId) {
      await supabase
        .from("ro_forecast_runs")
        .update({
          finished_at: new Date().toISOString(),
          status: "failed",
          error: err instanceof Error ? err.message : "Unknown error",
        })
        .eq("id", runId);
    }

    return NextResponse.json(
      { error: "Forecast run failed", run_id: runId },
      { status: 500 }
    );
  }
}

// GET — Vercel Cron (daily 6am)
export async function GET(req: NextRequest) {
  if (!verifyCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return executeForecastRun();
}

// POST — Manual trigger
export async function POST() {
  return executeForecastRun();
}
