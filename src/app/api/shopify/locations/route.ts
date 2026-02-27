import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";

// GET /api/shopify/locations — list Shopify locations
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("ro_shopify_locations")
      .select("*")
      .order("name");

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (err) {
    console.error("GET /api/shopify/locations error:", err);
    return NextResponse.json(
      { error: "Failed to fetch locations" },
      { status: 500 }
    );
  }
}
