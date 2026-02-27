import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";

// GET /api/forecast/accuracy
export async function GET(req: NextRequest) {
  try {
    const sku = req.nextUrl.searchParams.get("sku");

    let query = supabase
      .from("ro_forecast_accuracy")
      .select("*")
      .order("period_end", { ascending: false })
      .limit(200);

    if (sku) query = query.eq("sku", sku);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (err) {
    console.error("GET /api/forecast/accuracy error:", err);
    return NextResponse.json(
      { error: "Failed to fetch forecast accuracy" },
      { status: 500 }
    );
  }
}
