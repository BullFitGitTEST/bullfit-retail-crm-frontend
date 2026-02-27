import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";

// GET /api/retail-ops/job-runs — list job runs with optional filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const module = searchParams.get("module");
    const jobType = searchParams.get("job_type");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    let query = supabase
      .from("job_runs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(limit);

    if (module) query = query.eq("module", module);
    if (jobType) query = query.eq("job_type", jobType);
    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (err) {
    console.error("GET /api/retail-ops/job-runs error:", err);
    return NextResponse.json(
      { error: "Failed to fetch job runs" },
      { status: 500 }
    );
  }
}
