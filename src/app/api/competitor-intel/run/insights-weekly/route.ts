import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { aiGenerateInsights, getPromptVersion } from "@/lib/competitor-intel/ai-service";
import { checkInsightCompliance } from "@/lib/competitor-intel/compliance";
import type { ExtractedData, DiffResult } from "@/lib/competitor-intel/types";

// Vercel Cron auth check
function verifyCron(req: NextRequest): boolean {
  if (!process.env.CRON_SECRET) return true;
  return req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
}

// Core logic
async function runInsightsWeekly(opts?: { competitor_id?: string }) {
  const startedAt = new Date().toISOString();
  let runId: string | null = null;
  const forceCompetitorId = opts?.competitor_id;

  try {
    const { data: run } = await supabase
      .from("ci_competitor_runs")
      .insert({
        run_type: "insight_generation",
        competitor_id: forceCompetitorId || null,
        started_at: startedAt,
        status: "running",
        prompt_version: getPromptVersion("insight"),
        input_json: { competitor_id: forceCompetitorId },
      })
      .select("id")
      .single();

    runId = run?.id || null;

    const periodEnd = new Date();
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - 7);

    let compQuery = supabase
      .from("ci_competitors")
      .select("id, name")
      .eq("is_active", true);

    if (forceCompetitorId) {
      compQuery = compQuery.eq("id", forceCompetitorId);
    }

    const { data: competitors, error: compErr } = await compQuery;
    if (compErr) throw compErr;

    const results: Array<{
      competitor_id: string;
      insight_id: string | null;
      status: string;
    }> = [];

    for (const competitor of competitors || []) {
      try {
        const { data: diffs } = await supabase
          .from("ci_competitor_diffs")
          .select(`
            id,
            source_id,
            from_snapshot_id,
            to_snapshot_id,
            diff_json,
            ci_competitor_sources!inner(url, source_type)
          `)
          .eq("competitor_id", competitor.id)
          .gte("created_at", periodStart.toISOString())
          .lte("created_at", periodEnd.toISOString());

        if (!diffs || diffs.length === 0) {
          results.push({
            competitor_id: competitor.id,
            insight_id: null,
            status: "skipped: no diffs in period",
          });
          continue;
        }

        const diffInputs = await Promise.all(
          diffs.map(async (d) => {
            const { data: toSnapshot } = await supabase
              .from("ci_competitor_snapshots")
              .select("extracted_json")
              .eq("id", d.to_snapshot_id)
              .single();

            const source = d.ci_competitor_sources as unknown as {
              url: string;
              source_type: string;
            };

            return {
              diff_id: d.id,
              source_url: source?.url || "unknown",
              source_type: source?.source_type || "unknown",
              from_snapshot_id: d.from_snapshot_id,
              to_snapshot_id: d.to_snapshot_id,
              diff_json: d.diff_json as DiffResult,
              to_extracted_json: (toSnapshot?.extracted_json || {}) as ExtractedData,
            };
          })
        );

        const aiResult = await aiGenerateInsights({
          competitor_name: competitor.name,
          competitor_id: competitor.id,
          diffs: diffInputs,
        });

        const { summary, opportunities, threats } = aiResult.output;

        const validSnapshotIds = new Set(
          diffs.flatMap((d) => [d.from_snapshot_id, d.to_snapshot_id])
        );

        const compliance = checkInsightCompliance(
          summary,
          opportunities,
          threats,
          validSnapshotIds
        );

        const allCitations = [
          ...opportunities.flatMap((o) => o.citations),
          ...threats.flatMap((t) => t.citations),
        ];

        const { data: insight, error: insightErr } = await supabase
          .from("ci_competitor_insights")
          .insert({
            competitor_id: competitor.id,
            period_start: periodStart.toISOString().split("T")[0],
            period_end: periodEnd.toISOString().split("T")[0],
            summary,
            opportunities,
            threats,
            citations: allCitations,
          })
          .select("id")
          .single();

        if (insightErr) throw insightErr;

        if (runId) {
          await supabase
            .from("ci_competitor_runs")
            .update({
              citations: allCitations,
              compliance_json: compliance,
            })
            .eq("id", runId);
        }

        results.push({
          competitor_id: competitor.id,
          insight_id: insight?.id || null,
          status: compliance.passed ? "success" : "success_with_flags",
        });
      } catch (insightErr) {
        console.error(
          `Insight generation failed for competitor ${competitor.id}:`,
          insightErr
        );
        results.push({
          competitor_id: competitor.id,
          insight_id: null,
          status: `error: ${insightErr instanceof Error ? insightErr.message : "unknown"}`,
        });
      }
    }

    if (runId) {
      await supabase
        .from("ci_competitor_runs")
        .update({
          finished_at: new Date().toISOString(),
          status: "success",
          model: process.env.AI_MODEL || "gpt-4o",
          output_json: { results },
        })
        .eq("id", runId);
    }

    return NextResponse.json({ run_id: runId, results });
  } catch (err) {
    console.error("insights-weekly error:", err);

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

    return NextResponse.json(
      { error: "Insight generation failed" },
      { status: 500 }
    );
  }
}

// GET — Vercel Cron trigger
export async function GET(req: NextRequest) {
  if (!verifyCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return runInsightsWeekly();
}

// POST — Manual trigger
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return runInsightsWeekly({ competitor_id: body.competitor_id });
}
