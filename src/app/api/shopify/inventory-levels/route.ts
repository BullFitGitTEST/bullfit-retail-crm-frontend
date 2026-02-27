import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";

// GET /api/shopify/inventory-levels — inventory levels by location or SKU
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const locationId = searchParams.get("location_id");
    const sku = searchParams.get("sku");
    const limit = parseInt(searchParams.get("limit") || "500", 10);

    // If filtering by SKU, need to join through variants to get inventory_item_id
    if (sku) {
      const { data: variants } = await supabase
        .from("ro_shopify_variants")
        .select("inventory_item_id")
        .eq("sku", sku);

      const itemIds = (variants || [])
        .map((v) => v.inventory_item_id)
        .filter(Boolean);

      if (itemIds.length === 0) {
        return NextResponse.json([]);
      }

      let query = supabase
        .from("ro_shopify_inventory_levels")
        .select("*")
        .in("shopify_inventory_item_id", itemIds)
        .limit(limit);

      if (locationId) {
        query = query.eq("shopify_location_id", parseInt(locationId, 10));
      }

      const { data, error } = await query;
      if (error) throw error;
      return NextResponse.json(data || []);
    }

    let query = supabase
      .from("ro_shopify_inventory_levels")
      .select("*")
      .limit(limit);

    if (locationId) {
      query = query.eq("shopify_location_id", parseInt(locationId, 10));
    }

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (err) {
    console.error("GET /api/shopify/inventory-levels error:", err);
    return NextResponse.json(
      { error: "Failed to fetch inventory levels" },
      { status: 500 }
    );
  }
}
