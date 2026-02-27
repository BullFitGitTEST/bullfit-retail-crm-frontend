import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";

function verifyCron(req: NextRequest): boolean {
  if (!process.env.CRON_SECRET) return true;
  return req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
}

async function calculateAccuracy() {
  const startedAt = new Date().toISOString();

  const { data: run } = await supabase
    .from("job_runs")
    .insert({
      job_type: "forecast_accuracy",
      module: "forecast",
      status: "running",
      trigger_type: "manual",
      started_at: startedAt,
    })
    .select("id")
    .single();

  const runId = run?.id;

  try {
    // Find forecast run from ~30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const fortyDaysAgo = new Date();
    fortyDaysAgo.setDate(fortyDaysAgo.getDate() - 40);

    const { data: oldRun } = await supabase
      .from("ro_forecast_runs")
      .select("id, started_at")
      .eq("status", "success")
      .gte("started_at", fortyDaysAgo.toISOString())
      .lte("started_at", thirtyDaysAgo.toISOString())
      .order("started_at", { ascending: false })
      .limit(1)
      .single();

    if (!oldRun) {
      if (runId) {
        await supabase
          .from("job_runs")
          .update({
            finished_at: new Date().toISOString(),
            status: "success",
            output_json: { message: "No forecast run found from ~30 days ago" },
          })
          .eq("id", runId);
      }
      return NextResponse.json({
        message: "No forecast run from ~30 days ago to compare",
      });
    }

    // Get forecast lines from that run
    const { data: forecastLines } = await supabase
      .from("ro_forecast_sku_lines")
      .select("sku, demand_units_30, forecast_run_id")
      .eq("forecast_run_id", oldRun.id);

    if (!forecastLines || forecastLines.length === 0) {
      return NextResponse.json({ message: "No forecast lines to compare" });
    }

    // Get actual sales for the 30-day period after that forecast
    const forecastDate = new Date(oldRun.started_at);
    const periodStart = forecastDate.toISOString().split("T")[0];
    const periodEndDate = new Date(forecastDate);
    periodEndDate.setDate(periodEndDate.getDate() + 30);
    const periodEnd = periodEndDate.toISOString().split("T")[0];

    const skus = forecastLines.map((f) => f.sku);
    const { data: salesData } = await supabase
      .from("ro_shopify_sales_daily")
      .select("sku, units_sold")
      .in("sku", skus)
      .gte("shop_date", periodStart)
      .lte("shop_date", periodEnd);

    // Sum actual sales by SKU
    const actualBySku = new Map<string, number>();
    for (const s of salesData || []) {
      actualBySku.set(s.sku, (actualBySku.get(s.sku) || 0) + s.units_sold);
    }

    // Compute accuracy
    const accuracyRows = forecastLines.map((f) => {
      const actual = actualBySku.get(f.sku) || 0;
      const errorUnits = Math.abs(f.demand_units_30 - actual);
      const errorPct =
        actual > 0
          ? Number(((errorUnits / actual) * 100).toFixed(1))
          : f.demand_units_30 > 0
            ? 100
            : 0;

      return {
        sku: f.sku,
        forecast_run_id: f.forecast_run_id,
        period_start: periodStart,
        period_end: periodEnd,
        forecasted_units: f.demand_units_30,
        actual_units: actual,
        error_units: errorUnits,
        error_pct: errorPct,
      };
    });

    // Upsert accuracy rows
    const BATCH = 100;
    let inserted = 0;
    for (let i = 0; i < accuracyRows.length; i += BATCH) {
      const batch = accuracyRows.slice(i, i + BATCH);
      const { error } = await supabase
        .from("ro_forecast_accuracy")
        .insert(batch);
      if (!error) inserted += batch.length;
    }

    if (runId) {
      await supabase
        .from("job_runs")
        .update({
          finished_at: new Date().toISOString(),
          status: "success",
          output_json: {
            forecast_run_compared: oldRun.id,
            skus_compared: accuracyRows.length,
            avg_error_pct: Number(
              (
                accuracyRows.reduce((sum, r) => sum + r.error_pct, 0) /
                accuracyRows.length
              ).toFixed(1)
            ),
          },
        })
        .eq("id", runId);
    }

    return NextResponse.json({
      run_id: runId,
      accuracy_rows_created: inserted,
      forecast_run_compared: oldRun.id,
    });
  } catch (err) {
    console.error("Forecast accuracy error:", err);

    if (runId) {
      await supabase
        .from("job_runs")
        .update({
          finished_at: new Date().toISOString(),
          status: "failed",
          error: err instanceof Error ? err.message : "Unknown error",
        })
        .eq("id", runId);
    }

    return NextResponse.json(
      { error: "Accuracy calculation failed" },
      { status: 500 }
    );
  }
}

// GET — Vercel Cron (Monday 7am)
export async function GET(req: NextRequest) {
  if (!verifyCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return calculateAccuracy();
}

// POST — Manual trigger
export async function POST() {
  return calculateAccuracy();
}
