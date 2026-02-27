import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";

// GET /api/shopify/products — list synced products with variants
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const search = searchParams.get("q");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    let query = supabase
      .from("ro_shopify_products")
      .select("*")
      .order("title")
      .limit(limit);

    if (search) query = query.ilike("title", `%${search}%`);
    if (status) query = query.eq("status", status);

    const { data: products, error } = await query;
    if (error) throw error;

    // Attach variants
    const enriched = await Promise.all(
      (products || []).map(async (p) => {
        const { data: variants } = await supabase
          .from("ro_shopify_variants")
          .select("*")
          .eq("shopify_product_id", p.shopify_product_id)
          .order("title");

        return { ...p, variants: variants || [] };
      })
    );

    return NextResponse.json(enriched);
  } catch (err) {
    console.error("GET /api/shopify/products error:", err);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
