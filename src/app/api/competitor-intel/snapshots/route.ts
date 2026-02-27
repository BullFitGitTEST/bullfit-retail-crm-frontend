import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";

// GET /api/competitor-intel/snapshots
export async function GET(req: NextRequest) {
  try {
    const competitorId = req.nextUrl.searchParams.get("competitor_id");
    const sourceType = req.nextUrl.searchParams.get("source_type");
    const fromDate = req.nextUrl.searchParams.get("from_date");
    const toDate = req.nextUrl.searchParams.get("to_date");

    let query = supabase
      .from("ci_competitor_snapshots")
      .select(`
        *,
        ci_competitors(name),
        ci_ci_competitor_sources(url, source_type)
      `)
      .order("fetched_at", { ascending: false })
      .limit(100);

    if (competitorId) query = query.eq("competitor_id", competitorId);
    if (fromDate) query = query.gte("fetched_at", fromDate);
    if (toDate) query = query.lte("fetched_at", toDate);

    const { data, error } = await query;
    if (error) throw error;

    // Flatten joins and optionally filter source_type
    const results = (data || [])
      .map((s) => {
        const comp = s.ci_competitors as unknown as { name: string } | null;
        const src = s.ci_competitor_sources as unknown as {
          url: string;
          source_type: string;
        } | null;
        return {
          ...s,
          competitor_name: comp?.name || "Unknown",
          source_url: src?.url || "",
          source_type: src?.source_type || "",
          ci_competitors: undefined,
          ci_competitor_sources: undefined,
        };
      })
      .filter((s) => !sourceType || s.source_type === sourceType);

    return NextResponse.json(results);
  } catch (err) {
    console.error("GET /api/competitor-intel/snapshots error:", err);
    return NextResponse.json({ error: "Failed to fetch snapshots" }, { status: 500 });
  }
}
