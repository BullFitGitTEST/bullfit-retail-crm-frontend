import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { aiDiscoverCompetitors, getPromptVersion } from "@/lib/competitor-intel/ai-service";
import type { DiscoverCompetitorsInput } from "@/lib/competitor-intel/types";

// POST /api/competitor-intel/run/discover-competitors
// AI-powered competitor discovery — suggests competitors based on BullFit's portfolio
export async function POST(req: NextRequest) {
  const startedAt = new Date().toISOString();
  let runId: string | null = null;

  try {
    const body = (await req.json().catch(() => ({}))) as DiscoverCompetitorsInput;

    // Create run log
    const { data: run } = await supabase
      .from("ci_competitor_runs")
      .insert({
        run_type: "competitor_discovery",
        started_at: startedAt,
        status: "running",
        prompt_version: getPromptVersion("discovery"),
        input_json: body,
      })
      .select("id")
      .single();

    runId = run?.id || null;

    // Fetch existing competitor names to auto-exclude duplicates
    const { data: existingCompetitors } = await supabase
      .from("ci_competitors")
      .select("name");

    const existingNames = (existingCompetitors || []).map((c) => c.name);

    // Merge client-provided exclude list with DB names
    const excludeNames = [
      ...new Set([...(body.exclude_names || []), ...existingNames]),
    ];

    // Call AI
    const aiResult = await aiDiscoverCompetitors({
      ...body,
      exclude_names: excludeNames,
    });

    const { suggestions, market_context } = aiResult.output;

    // Filter out any suggestions that match existing competitor names (case-insensitive safety net)
    const existingNamesLower = new Set(existingNames.map((n) => n.toLowerCase()));
    const filteredSuggestions = suggestions.filter(
      (s) => !existingNamesLower.has(s.name.toLowerCase())
    );

    // Update run log
    if (runId) {
      await supabase
        .from("ci_competitor_runs")
        .update({
          finished_at: new Date().toISOString(),
          status: "success",
          model: aiResult.model,
          output_json: {
            suggestions_count: filteredSuggestions.length,
            market_context,
            suggestions: filteredSuggestions,
          },
        })
        .eq("id", runId);
    }

    return NextResponse.json({
      run_id: runId,
      market_context,
      suggestions: filteredSuggestions,
    });
  } catch (err) {
    console.error("discover-competitors error:", err);

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
      { error: "Competitor discovery failed" },
      { status: 500 }
    );
  }
}
