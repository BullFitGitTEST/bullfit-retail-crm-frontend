import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  aiGenerateRecommendations,
  aiCriticReview,
  getPromptVersion,
} from "@/lib/competitor-intel/ai-service";
import { checkRecommendationCompliance } from "@/lib/competitor-intel/compliance";

// Vercel Cron auth check
function verifyCron(req: NextRequest): boolean {
  if (!process.env.CRON_SECRET) return true;
  return req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
}

// Core logic
async function runRecommendationsWeekly(opts?: {
  competitor_id?: string;
  insight_id?: string;
}) {
  const startedAt = new Date().toISOString();
  let runId: string | null = null;
  const forceCompetitorId = opts?.competitor_id;
  const forceInsightId = opts?.insight_id;

  try {
    const { data: run } = await supabase
      .from("ci_competitor_runs")
      .insert({
        run_type: "recommendation_generation",
        competitor_id: forceCompetitorId || null,
        started_at: startedAt,
        status: "running",
        prompt_version: getPromptVersion("recommendation"),
        input_json: { competitor_id: forceCompetitorId, insight_id: forceInsightId },
      })
      .select("id")
      .single();

    runId = run?.id || null;

    let insightQuery = supabase
      .from("ci_competitor_insights")
      .select("*, ci_competitors!inner(name)")
      .order("created_at", { ascending: false });

    if (forceInsightId) {
      insightQuery = insightQuery.eq("id", forceInsightId);
    } else if (forceCompetitorId) {
      insightQuery = insightQuery.eq("competitor_id", forceCompetitorId).limit(1);
    } else {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      insightQuery = insightQuery.gte(
        "created_at",
        sevenDaysAgo.toISOString()
      );
    }

    const { data: insights, error: insightErr } = await insightQuery;
    if (insightErr) throw insightErr;

    const insightIds = (insights || []).map((i) => i.id);
    const { data: existingRecs } = await supabase
      .from("ci_competitor_recommendations")
      .select("insight_id")
      .in("insight_id", insightIds.length > 0 ? insightIds : ["__none__"]);

    const existingInsightIds = new Set(
      (existingRecs || []).map((r) => r.insight_id)
    );

    const pendingInsights = (insights || []).filter(
      (i) => !existingInsightIds.has(i.id) || forceInsightId
    );

    const results: Array<{
      competitor_id: string;
      insight_id: string;
      recommendation_id: string | null;
      status: string;
      compliance_passed: boolean;
    }> = [];

    for (const insight of pendingInsights) {
      try {
        const comp = insight.ci_competitors as unknown as { name: string };

        const aiResult = await aiGenerateRecommendations({
          competitor_id: insight.competitor_id,
          competitor_name: comp?.name || "Unknown",
          insight_id: insight.id,
          summary: insight.summary,
          opportunities: insight.opportunities,
          threats: insight.threats,
          all_citations: insight.citations,
        });

        const { recommendations } = aiResult.output;

        const validSnapshotIds = new Set<string>(
          (insight.citations as Array<{ snapshot_id: string }>).map(
            (c) => c.snapshot_id
          )
        );

        const deterministicCompliance = checkRecommendationCompliance(
          recommendations,
          validSnapshotIds
        );

        const criticResult = await aiCriticReview({
          type: "recommendations",
          competitor: comp?.name,
          recommendations,
        });

        const overallCompliance = {
          passed: deterministicCompliance.passed && criticResult.output.passed,
          deterministic_flags: deterministicCompliance.flags,
          critic_flags: criticResult.output.flags,
        };

        const { data: rec, error: recErr } = await supabase
          .from("ci_competitor_recommendations")
          .insert({
            competitor_id: insight.competitor_id,
            insight_id: insight.id,
            period_start: insight.period_start,
            period_end: insight.period_end,
            recommendations,
          })
          .select("id")
          .single();

        if (recErr) throw recErr;

        results.push({
          competitor_id: insight.competitor_id,
          insight_id: insight.id,
          recommendation_id: rec?.id || null,
          status: "success",
          compliance_passed: overallCompliance.passed,
        });
      } catch (recErr) {
        console.error(
          `Recommendation generation failed for insight ${insight.id}:`,
          recErr
        );
        results.push({
          competitor_id: insight.competitor_id,
          insight_id: insight.id,
          recommendation_id: null,
          status: `error: ${recErr instanceof Error ? recErr.message : "unknown"}`,
          compliance_passed: false,
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
    console.error("recommendations-weekly error:", err);

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
      { error: "Recommendation generation failed" },
      { status: 500 }
    );
  }
}

// GET — Vercel Cron trigger
export async function GET(req: NextRequest) {
  if (!verifyCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return runRecommendationsWeekly();
}

// POST — Manual trigger
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return runRecommendationsWeekly({
    competitor_id: body.competitor_id,
    insight_id: body.insight_id,
  });
}
