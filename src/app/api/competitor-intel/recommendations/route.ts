import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/competitor-intel/recommendations
export async function GET(req: NextRequest) {
  try {
    const competitorId = req.nextUrl.searchParams.get("competitor_id");
    const fromDate = req.nextUrl.searchParams.get("from_date");
    const toDate = req.nextUrl.searchParams.get("to_date");

    let query = supabase
      .from("ci_competitor_recommendations")
      .select(`*, ci_competitors(name), ci_competitor_insights(summary)`)
      .order("created_at", { ascending: false })
      .limit(50);

    if (competitorId) query = query.eq("competitor_id", competitorId);
    if (fromDate) query = query.gte("period_start", fromDate);
    if (toDate) query = query.lte("period_end", toDate);

    const { data, error } = await query;
    if (error) throw error;

    const results = (data || []).map((r) => {
      const comp = r.ci_competitors as unknown as { name: string } | null;
      return {
        competitor_id: r.competitor_id,
        competitor_name: comp?.name || "Unknown",
        insight_id: r.insight_id,
        recommendations: r.recommendations,
        period_start: r.period_start,
        period_end: r.period_end,
      };
    });

    return NextResponse.json(results);
  } catch (err) {
    console.error("GET /api/competitor-intel/recommendations error:", err);
    return NextResponse.json(
      { error: "Failed to fetch recommendations" },
      { status: 500 }
    );
  }
}
