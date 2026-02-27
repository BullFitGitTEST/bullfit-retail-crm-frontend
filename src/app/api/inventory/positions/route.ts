import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { computePosition } from "@/lib/inventory/compute";
import { generateAlerts } from "@/lib/inventory/alerts";

// GET /api/inventory/positions — computed positions per SKU (live)
export async function GET(req: NextRequest) {
  try {
    const sku = req.nextUrl.searchParams.get("sku");

    // Get all active variants with SKUs
    let variantsQuery = supabase
      .from("ro_shopify_variants")
      .select("sku, inventory_item_id")
      .not("sku", "is", null);

    if (sku) variantsQuery = variantsQuery.eq("sku", sku);

    const { data: variants } = await variantsQuery;
    if (!variants || variants.length === 0) {
      return NextResponse.json([]);
    }

    // Build SKU → inventory_item_ids map
    const skuItemMap = new Map<string, number[]>();
    for (const v of variants) {
      if (!v.sku || !v.inventory_item_id) continue;
      const items = skuItemMap.get(v.sku) || [];
      items.push(v.inventory_item_id);
      skuItemMap.set(v.sku, items);
    }

    // Get inventory locations config
    const { data: locations } = await supabase
      .from("ro_inventory_locations")
      .select("*")
      .eq("is_active", true);

    const locationConfigs = (locations || []).map((l) => ({
      shopify_location_id: l.shopify_location_id as number,
      location_name: l.name as string,
      include_in_on_hand: l.include_in_on_hand as boolean,
    }));

    // If no custom locations configured, use Shopify locations as fallback
    if (locationConfigs.length === 0) {
      const { data: shopifyLocs } = await supabase
        .from("ro_shopify_locations")
        .select("shopify_location_id, name")
        .eq("is_active", true);

      for (const sl of shopifyLocs || []) {
        locationConfigs.push({
          shopify_location_id: sl.shopify_location_id,
          location_name: sl.name,
          include_in_on_hand: true,
        });
      }
    }

    // Get all inventory levels
    const allItemIds = Array.from(skuItemMap.values()).flat();
    const { data: levels } = await supabase
      .from("ro_shopify_inventory_levels")
      .select("shopify_inventory_item_id, shopify_location_id, available")
      .in("shopify_inventory_item_id", allItemIds);

    // Get active reservations
    const skus = Array.from(skuItemMap.keys());
    const { data: reservations } = await supabase
      .from("ro_reserved_inventory")
      .select("sku, units, is_active")
      .in("sku", skus)
      .eq("is_active", true);

    // Get product master for alerts
    const { data: masters } = await supabase
      .from("ro_product_master")
      .select("*")
      .in("sku", skus);

    const masterMap = new Map(
      (masters || []).map((m) => [m.sku, m])
    );

    // Get trailing 30-day sales for alerts
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { data: salesData } = await supabase
      .from("ro_shopify_sales_daily")
      .select("sku, units_sold")
      .in("sku", skus)
      .gte("shop_date", thirtyDaysAgo.toISOString().split("T")[0]);

    const salesBySku = new Map<string, number>();
    for (const s of salesData || []) {
      salesBySku.set(s.sku, (salesBySku.get(s.sku) || 0) + s.units_sold);
    }

    // Compute positions per SKU
    const positions = [];
    for (const [skuKey, itemIds] of skuItemMap) {
      const skuLevels = (levels || [])
        .filter((l) => itemIds.includes(l.shopify_inventory_item_id))
        .map((l) => ({
          shopify_location_id: l.shopify_location_id,
          available: l.available,
        }));

      const skuReservations = (reservations || [])
        .filter((r) => r.sku === skuKey)
        .map((r) => ({ units: r.units, is_active: r.is_active }));

      const position = computePosition({
        sku: skuKey,
        levels: skuLevels,
        locations: locationConfigs,
        reservations: skuReservations,
        poLines: [], // Will be populated when supply_pos is built
      });

      const master = masterMap.get(skuKey);
      const alerts = generateAlerts({
        sku: skuKey,
        available_units: position.available_units,
        on_order_units: position.on_order_units,
        safety_stock_units: master?.safety_stock_units || 0,
        reorder_point_units: master?.reorder_point_units || 0,
        lead_time_days: master?.lead_time_days || 30,
        trailing_30_day_units: salesBySku.get(skuKey) || 0,
      });

      positions.push({ ...position, alerts });
    }

    // Sort by available (lowest first) for urgency
    positions.sort((a, b) => a.available_units - b.available_units);

    return NextResponse.json(positions);
  } catch (err) {
    console.error("GET /api/inventory/positions error:", err);
    return NextResponse.json(
      { error: "Failed to compute positions" },
      { status: 500 }
    );
  }
}
