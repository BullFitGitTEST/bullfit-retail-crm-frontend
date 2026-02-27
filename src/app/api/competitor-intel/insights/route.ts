import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/competitor-intel/insights
export async function GET(req: NextRequest) {
  try {
    const competitorId = req.nextUrl.searchParams.get("competitor_id");

    let query = supabase
      .from("ci_competitor_insights")
      .select(`*, ci_competitors(name)`)
      .order("created_at", { ascending: false })
      .limit(50);

    if (competitorId) query = query.eq("competitor_id", competitorId);

    const { data, error } = await query;
    if (error) throw error;

    const results = (data || []).map((i) => {
      const comp = i.ci_competitors as unknown as { name: string } | null;
      return {
        ...i,
        competitor_name: comp?.name || "Unknown",
        ci_competitors: undefined,
      };
    });

    return NextResponse.json(results);
  } catch (err) {
    console.error("GET /api/competitor-intel/insights error:", err);
    return NextResponse.json({ error: "Failed to fetch insights" }, { status: 500 });
  }
}
