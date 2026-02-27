import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";

// GET /api/competitor-intel/diffs
export async function GET(req: NextRequest) {
  try {
    const competitorId = req.nextUrl.searchParams.get("competitor_id");
    const fromDate = req.nextUrl.searchParams.get("from_date");
    const toDate = req.nextUrl.searchParams.get("to_date");

    let query = supabase
      .from("ci_competitor_diffs")
      .select(`
        *,
        ci_competitors(name),
        ci_ci_competitor_sources(url, source_type)
      `)
      .order("created_at", { ascending: false })
      .limit(100);

    if (competitorId) query = query.eq("competitor_id", competitorId);
    if (fromDate) query = query.gte("created_at", fromDate);
    if (toDate) query = query.lte("created_at", toDate);

    const { data, error } = await query;
    if (error) throw error;

    const results = (data || []).map((d) => {
      const comp = d.ci_competitors as unknown as { name: string } | null;
      const src = d.ci_competitor_sources as unknown as { url: string } | null;
      return {
        ...d,
        competitor_name: comp?.name || "Unknown",
        source_url: src?.url || "",
        ci_competitors: undefined,
        ci_competitor_sources: undefined,
      };
    });

    return NextResponse.json(results);
  } catch (err) {
    console.error("GET /api/competitor-intel/diffs error:", err);
    return NextResponse.json({ error: "Failed to fetch diffs" }, { status: 500 });
  }
}
