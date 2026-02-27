import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { computeDiff } from "@/lib/competitor-intel/diff";
import type { ExtractedData } from "@/lib/competitor-intel/types";

// Vercel Cron auth check
function verifyCron(req: NextRequest): boolean {
  if (!process.env.CRON_SECRET) return true;
  return req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
}

// Core logic
async function runDiff(opts?: { competitor_id?: string }) {
  const startedAt = new Date().toISOString();
  let runId: string | null = null;
  const forceCompetitorId = opts?.competitor_id;

  try {
    const { data: run } = await supabase
      .from("ci_competitor_runs")
      .insert({
        run_type: "diff",
        competitor_id: forceCompetitorId || null,
        started_at: startedAt,
        status: "running",
        input_json: { competitor_id: forceCompetitorId },
      })
      .select("id")
      .single();

    runId = run?.id || null;

    let query = supabase
      .from("ci_competitor_sources")
      .select("id, competitor_id")
      .eq("is_active", true);

    if (forceCompetitorId) {
      query = query.eq("competitor_id", forceCompetitorId);
    }

    const { data: sources, error: sourcesErr } = await query;
    if (sourcesErr) throw sourcesErr;

    const results: Array<{
      source_id: string;
      diff_id: string | null;
      status: string;
    }> = [];

    for (const source of sources || []) {
      try {
        const { data: snapshots } = await supabase
          .from("ci_competitor_snapshots")
          .select("id, extracted_json, fetched_at")
          .eq("source_id", source.id)
          .eq("extraction_status", "success")
          .order("fetched_at", { ascending: false })
          .limit(2);

        if (!snapshots || snapshots.length < 2) {
          results.push({
            source_id: source.id,
            diff_id: null,
            status: "skipped: insufficient snapshots",
          });
          continue;
        }

        const [toSnapshot, fromSnapshot] = snapshots;

        const { data: existingDiff } = await supabase
          .from("ci_competitor_diffs")
          .select("id")
          .eq("from_snapshot_id", fromSnapshot.id)
          .eq("to_snapshot_id", toSnapshot.id)
          .single();

        if (existingDiff) {
          results.push({
            source_id: source.id,
            diff_id: existingDiff.id,
            status: "skipped: diff already exists",
          });
          continue;
        }

        const diffResult = computeDiff(
          fromSnapshot.extracted_json as ExtractedData,
          toSnapshot.extracted_json as ExtractedData
        );

        if (diffResult.changed_fields.length === 0) {
          results.push({
            source_id: source.id,
            diff_id: null,
            status: "skipped: no changes",
          });
          continue;
        }

        const { data: diff, error: diffErr } = await supabase
          .from("ci_competitor_diffs")
          .insert({
            competitor_id: source.competitor_id,
            source_id: source.id,
            from_snapshot_id: fromSnapshot.id,
            to_snapshot_id: toSnapshot.id,
            diff_json: diffResult,
            severity_score: diffResult.severity_score,
          })
          .select("id")
          .single();

        if (diffErr) throw diffErr;

        results.push({
          source_id: source.id,
          diff_id: diff?.id || null,
          status: "created",
        });
      } catch (diffErr) {
        console.error(`Diff failed for source ${source.id}:`, diffErr);
        results.push({
          source_id: source.id,
          diff_id: null,
          status: `error: ${diffErr instanceof Error ? diffErr.message : "unknown"}`,
        });
      }
    }

    if (runId) {
      await supabase
        .from("ci_competitor_runs")
        .update({
          finished_at: new Date().toISOString(),
          status: "success",
          output_json: { results, sources_processed: results.length },
        })
        .eq("id", runId);
    }

    return NextResponse.json({
      run_id: runId,
      sources_processed: results.length,
      results,
    });
  } catch (err) {
    console.error("diff error:", err);

    if (runId) {
      await supabase
        .from("ci_competitor_runs")
        .update({
          finished_at: new Date().toISOString(),
          status: "failed",
          error: err instanceof Error ? err.message : "Unknown error",
        })
        .eq("id", runId);
    }

    return NextResponse.json({ error: "Diff run failed" }, { status: 500 });
  }
}

// GET — Vercel Cron trigger
export async function GET(req: NextRequest) {
  if (!verifyCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return runDiff();
}

// POST — Manual trigger
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return runDiff({ competitor_id: body.competitor_id });
}
