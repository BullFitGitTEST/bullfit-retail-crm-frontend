import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/competitor-intel/runs
export async function GET(req: NextRequest) {
  try {
    const runType = req.nextUrl.searchParams.get("run_type");
    const status = req.nextUrl.searchParams.get("status");
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "50", 10);

    let query = supabase
      .from("ci_competitor_runs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(limit);

    if (runType) query = query.eq("run_type", runType);
    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (err) {
    console.error("GET /api/competitor-intel/runs error:", err);
    return NextResponse.json({ error: "Failed to fetch runs" }, { status: 500 });
  }
}
