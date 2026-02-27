import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { runSalesIngest, runInitialSalesLoad } from "@/lib/shopify/sales-ingest";

function verifyCron(req: NextRequest): boolean {
  if (!process.env.CRON_SECRET) return true;
  return req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
}

async function executeSalesSync(daysBack?: number) {
  const startedAt = new Date().toISOString();
  const isInitial = daysBack && daysBack >= 365;

  const { data: run } = await supabase
    .from("job_runs")
    .insert({
      job_type: isInitial ? "shopify_sales_initial" : "shopify_sales_nightly",
      module: "shopify",
      status: "running",
      trigger_type: "manual",
      started_at: startedAt,
      input_json: { days_back: daysBack || 2 },
    })
    .select("id")
    .single();

  const runId = run?.id;

  try {
    const result = isInitial
      ? await runInitialSalesLoad()
      : await runSalesIngest(daysBack || 2);

    if (runId) {
      await supabase
        .from("job_runs")
        .update({
          finished_at: new Date().toISOString(),
          status: result.errors.length > 0 ? "failed" : "success",
          output_json: result,
          error:
            result.errors.length > 0 ? result.errors.join("; ") : null,
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
      { error: "Sales sync failed", run_id: runId },
      { status: 500 }
    );
  }
}

// GET — Vercel Cron (nightly at 3am)
export async function GET(req: NextRequest) {
  if (!verifyCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return executeSalesSync(2);
}

// POST — Manual trigger with optional days_back
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return executeSalesSync(body.days_back);
}
