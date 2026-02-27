import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";

function verifyCron(req: NextRequest): boolean {
  if (!process.env.CRON_SECRET) return true;
  return req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
}

async function takeSnapshot() {
  const startedAt = new Date().toISOString();
  const today = new Date().toISOString().split("T")[0];

  const { data: run } = await supabase
    .from("job_runs")
    .insert({
      job_type: "inventory_snapshot",
      module: "inventory",
      status: "running",
      trigger_type: "manual",
      started_at: startedAt,
      input_json: { snapshot_date: today },
    })
    .select("id")
    .single();

  const runId = run?.id;

  try {
    // Fetch positions from our own API
    const posRes = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/inventory/positions`
    );
    const positions = posRes.ok ? await posRes.json() : [];

    // Upsert snapshots
    const snapshots = positions.map(
      (p: {
        sku: string;
        on_hand_units: number;
        reserved_units: number;
        available_units: number;
        on_order_units: number;
        in_transit_units: number;
        breakdown: unknown;
      }) => ({
        snapshot_date: today,
        sku: p.sku,
        on_hand_units: p.on_hand_units,
        reserved_units: p.reserved_units,
        available_units: p.available_units,
        on_order_units: p.on_order_units,
        in_transit_units: p.in_transit_units,
        breakdown_json: p.breakdown || {},
      })
    );

    let upserted = 0;
    const BATCH = 100;
    for (let i = 0; i < snapshots.length; i += BATCH) {
      const batch = snapshots.slice(i, i + BATCH);
      const { error } = await supabase
        .from("ro_inventory_position_snapshots")
        .upsert(batch, { onConflict: "snapshot_date,sku" });
      if (!error) upserted += batch.length;
    }

    if (runId) {
      await supabase
        .from("job_runs")
        .update({
          finished_at: new Date().toISOString(),
          status: "success",
          output_json: { snapshot_date: today, skus_snapped: upserted },
        })
        .eq("id", runId);
    }

    return NextResponse.json({
      run_id: runId,
      snapshot_date: today,
      skus_snapped: upserted,
    });
  } catch (err) {
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
      { error: "Snapshot failed", run_id: runId },
      { status: 500 }
    );
  }
}

// GET — Vercel Cron (daily 6:10am)
export async function GET(req: NextRequest) {
  if (!verifyCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return takeSnapshot();
}

// POST — Manual trigger
export async function POST() {
  return takeSnapshot();
}
