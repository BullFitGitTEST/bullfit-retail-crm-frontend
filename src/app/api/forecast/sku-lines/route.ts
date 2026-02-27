import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";

// GET /api/forecast/sku-lines — get forecast lines from latest run
export async function GET(req: NextRequest) {
  try {
    const sku = req.nextUrl.searchParams.get("sku");

    // Find latest successful run
    const { data: latestRun } = await supabase
      .from("ro_forecast_runs")
      .select("id")
      .eq("status", "success")
      .order("finished_at", { ascending: false })
      .limit(1)
      .single();

    if (!latestRun) {
      return NextResponse.json([]);
    }

    let query = supabase
      .from("ro_forecast_sku_lines")
      .select("*")
      .eq("forecast_run_id", latestRun.id)
      .order("sku");

    if (sku) query = query.eq("sku", sku);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (err) {
    console.error("GET /api/forecast/sku-lines error:", err);
    return NextResponse.json(
      { error: "Failed to fetch forecast lines" },
      { status: 500 }
    );
  }
}
