import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { CompetitorInput } from "@/lib/competitor-intel/types";

// GET /api/competitor-intel/competitors — list all competitors with stats
export async function GET() {
  try {
    const { data: competitors, error } = await supabase
      .from("ci_competitors")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Enrich with computed stats
    const enriched = await Promise.all(
      (competitors || []).map(async (c) => {
        // Sources count
        const { count: sourcesCount } = await supabase
          .from("ci_competitor_sources")
          .select("*", { count: "exact", head: true })
          .eq("competitor_id", c.id);

        // Last snapshot
        const { data: lastSnapshot } = await supabase
          .from("ci_competitor_snapshots")
          .select("fetched_at")
          .eq("competitor_id", c.id)
          .order("fetched_at", { ascending: false })
          .limit(1)
          .single();

        // Change score (sum of severity from diffs in last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const { data: recentDiffs } = await supabase
          .from("ci_competitor_diffs")
          .select("severity_score")
          .eq("competitor_id", c.id)
          .gte("created_at", sevenDaysAgo.toISOString());

        const changeScore = (recentDiffs || []).reduce(
          (sum, d) => sum + (d.severity_score || 0),
          0
        );

        return {
          ...c,
          sources_count: sourcesCount || 0,
          last_snapshot_at: lastSnapshot?.fetched_at || null,
          change_score_7d: Math.min(100, changeScore),
        };
      })
    );

    return NextResponse.json(enriched);
  } catch (err) {
    console.error("GET /api/competitor-intel/competitors error:", err);
    return NextResponse.json(
      { error: "Failed to fetch competitors" },
      { status: 500 }
    );
  }
}

// POST /api/competitor-intel/competitors — create a competitor
export async function POST(req: NextRequest) {
  try {
    const body: CompetitorInput = await req.json();

    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: "Competitor name is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("ci_competitors")
      .insert({
        name: body.name.trim(),
        tags: body.tags || [],
        priority: body.priority || "medium",
        is_active: body.is_active ?? true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("POST /api/competitor-intel/competitors error:", err);
    return NextResponse.json(
      { error: "Failed to create competitor" },
      { status: 500 }
    );
  }
}

// PATCH /api/competitor-intel/competitors — update a competitor
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("ci_competitors")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err) {
    console.error("PATCH /api/competitor-intel/competitors error:", err);
    return NextResponse.json(
      { error: "Failed to update competitor" },
      { status: 500 }
    );
  }
}
