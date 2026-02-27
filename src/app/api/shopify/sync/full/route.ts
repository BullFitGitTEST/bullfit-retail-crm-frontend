import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { runFullSync } from "@/lib/shopify/sync-engine";

// Vercel Cron auth check
function verifyCron(req: NextRequest): boolean {
  if (!process.env.CRON_SECRET) return true;
  return req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
}

async function executeFullSync() {
  const startedAt = new Date().toISOString();

  // Create job run
  const { data: run } = await supabase
    .from("job_runs")
    .insert({
      job_type: "shopify_full_sync",
      module: "shopify",
      status: "running",
      trigger_type: "manual",
      started_at: startedAt,
      input_json: {},
    })
    .select("id")
    .single();

  const runId = run?.id;

  try {
    const result = await runFullSync();

    if (runId) {
      await supabase
        .from("job_runs")
        .update({
          finished_at: new Date().toISOString(),
          status: "success",
          output_json: result,
        })
        .eq("id", runId);
    }

    return NextResponse.json({ run_id: runId, ...result });
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
      { error: "Full sync failed", run_id: runId },
      { status: 500 }
    );
  }
}

// GET — Vercel Cron trigger (runs daily at 2am)
export async function GET(req: NextRequest) {
  if (!verifyCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return executeFullSync();
}

// POST — Manual trigger
export async function POST() {
  return executeFullSync();
}
