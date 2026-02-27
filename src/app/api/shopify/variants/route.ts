import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";

// GET /api/shopify/variants — search variants by SKU or title
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const q = searchParams.get("q");
    const sku = searchParams.get("sku");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    let query = supabase
      .from("ro_shopify_variants")
      .select("*")
      .order("sku")
      .limit(limit);

    if (sku) {
      query = query.eq("sku", sku);
    } else if (q) {
      query = query.or(`sku.ilike.%${q}%,title.ilike.%${q}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (err) {
    console.error("GET /api/shopify/variants error:", err);
    return NextResponse.json(
      { error: "Failed to fetch variants" },
      { status: 500 }
    );
  }
}
