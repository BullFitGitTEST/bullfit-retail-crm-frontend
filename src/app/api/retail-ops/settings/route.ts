import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";

// GET /api/retail-ops/settings?category=
export async function GET(req: NextRequest) {
  try {
    const category = req.nextUrl.searchParams.get("category");

    let query = supabase.from("ro_settings").select("*");
    if (category) query = query.eq("category", category);
    query = query.order("category").order("key");

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (err) {
    console.error("GET /api/retail-ops/settings error:", err);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// POST /api/retail-ops/settings — upsert a setting
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { category, key, value, updated_by } = body;

    if (!category || !key) {
      return NextResponse.json(
        { error: "category and key are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("ro_settings")
      .upsert(
        { category, key, value, updated_by: updated_by || null },
        { onConflict: "category,key" }
      )
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    console.error("POST /api/retail-ops/settings error:", err);
    return NextResponse.json(
      { error: "Failed to upsert setting" },
      { status: 500 }
    );
  }
}
