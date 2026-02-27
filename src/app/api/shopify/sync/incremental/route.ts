import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { runIncrementalSync } from "@/lib/shopify/sync-engine";

function verifyCron(req: NextRequest): boolean {
  if (!process.env.CRON_SECRET) return true;
  return req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
}

async function executeIncrementalSync() {
  const startedAt = new Date().toISOString();

  // Get last successful sync time
  const { data: lastRun } = await supabase
    .from("job_runs")
    .select("finished_at")
    .eq("module", "shopify")
    .in("job_type", ["shopify_full_sync", "shopify_incremental_sync"])
    .eq("status", "success")
    .order("finished_at", { ascending: false })
    .limit(1)
    .single();

  // Default to 4 hours ago if no previous sync
  const since = lastRun?.finished_at
    ? lastRun.finished_at
    : new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();

  const { data: run } = await supabase
    .from("job_runs")
    .insert({
      job_type: "shopify_incremental_sync",
      module: "shopify",
      status: "running",
      trigger_type: "manual",
      started_at: startedAt,
      input_json: { since },
    })
    .select("id")
    .single();

  const runId = run?.id;

  try {
    const result = await runIncrementalSync(since);

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
      { error: "Incremental sync failed", run_id: runId },
      { status: 500 }
    );
  }
}

// GET — Vercel Cron (every 2h)
export async function GET(req: NextRequest) {
  if (!verifyCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return executeIncrementalSync();
}

// POST — Manual trigger
export async function POST() {
  return executeIncrementalSync();
}
