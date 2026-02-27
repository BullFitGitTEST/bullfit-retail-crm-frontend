import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";

// GET /api/forecast/stage-weights
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("ro_settings_forecast_stage_weights")
      .select("*")
      .order("probability");

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (err) {
    console.error("GET /api/forecast/stage-weights error:", err);
    return NextResponse.json(
      { error: "Failed to fetch stage weights" },
      { status: 500 }
    );
  }
}

// PATCH /api/forecast/stage-weights
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { stage, probability } = body;

    if (!stage || probability == null) {
      return NextResponse.json(
        { error: "stage and probability are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("ro_settings_forecast_stage_weights")
      .update({ probability })
      .eq("stage", stage)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    console.error("PATCH /api/forecast/stage-weights error:", err);
    return NextResponse.json(
      { error: "Failed to update stage weight" },
      { status: 500 }
    );
  }
}
