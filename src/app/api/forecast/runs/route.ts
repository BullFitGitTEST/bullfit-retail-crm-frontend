import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";

// GET /api/forecast/runs — list forecast runs
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("ro_forecast_runs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (err) {
    console.error("GET /api/forecast/runs error:", err);
    return NextResponse.json(
      { error: "Failed to fetch forecast runs" },
      { status: 500 }
    );
  }
}
