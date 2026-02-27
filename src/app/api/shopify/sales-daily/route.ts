import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";

// GET /api/shopify/sales-daily — daily sales data with date range + SKU filter
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const sku = searchParams.get("sku");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const limit = parseInt(searchParams.get("limit") || "1000", 10);

    let query = supabase
      .from("ro_shopify_sales_daily")
      .select("*")
      .order("shop_date", { ascending: false })
      .limit(limit);

    if (sku) query = query.eq("sku", sku);
    if (startDate) query = query.gte("shop_date", startDate);
    if (endDate) query = query.lte("shop_date", endDate);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (err) {
    console.error("GET /api/shopify/sales-daily error:", err);
    return NextResponse.json(
      { error: "Failed to fetch sales data" },
      { status: 500 }
    );
  }
}
