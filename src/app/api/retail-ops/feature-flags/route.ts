import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";

// GET /api/retail-ops/feature-flags — list all flags
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("feature_flags")
      .select("*")
      .order("flag_key");

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (err) {
    console.error("GET /api/retail-ops/feature-flags error:", err);
    return NextResponse.json(
      { error: "Failed to fetch feature flags" },
      { status: 500 }
    );
  }
}

// PATCH /api/retail-ops/feature-flags — toggle a flag
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { flag_key, is_enabled } = body;

    if (!flag_key) {
      return NextResponse.json(
        { error: "flag_key is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("feature_flags")
      .update({ is_enabled })
      .eq("flag_key", flag_key)
      .select()
      .single();

    if (error) throw error;

    // Audit log
    await supabase.from("audit_logs").insert({
      action: is_enabled ? "enable_feature" : "disable_feature",
      entity_type: "feature_flag",
      metadata: { flag_key, is_enabled },
    });

    return NextResponse.json(data);
  } catch (err) {
    console.error("PATCH /api/retail-ops/feature-flags error:", err);
    return NextResponse.json(
      { error: "Failed to update feature flag" },
      { status: 500 }
    );
  }
}
