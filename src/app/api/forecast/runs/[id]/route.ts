import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";

// GET /api/forecast/runs/[id] — single run with all SKU lines
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: run, error } = await supabase
      .from("ro_forecast_runs")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Forecast run not found" },
          { status: 404 }
        );
      }
      throw error;
    }

    const { data: skuLines } = await supabase
      .from("ro_forecast_sku_lines")
      .select("*")
      .eq("forecast_run_id", id)
      .order("sku");

    return NextResponse.json({ ...run, sku_lines: skuLines || [] });
  } catch (err) {
    console.error("GET /api/forecast/runs/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to fetch forecast run" },
      { status: 500 }
    );
  }
}
