import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { generatePONumber } from "@/lib/supply-pos/po-number";

// GET /api/supply-pos/pos — list POs
export async function GET(req: NextRequest) {
  try {
    const status = req.nextUrl.searchParams.get("status");
    const supplierId = req.nextUrl.searchParams.get("supplier_id");

    let query = supabase
      .from("ro_supply_pos")
      .select("*, ro_suppliers(name)")
      .order("created_at", { ascending: false })
      .limit(100);

    if (status) query = query.eq("status", status);
    if (supplierId) query = query.eq("supplier_id", supplierId);

    const { data, error } = await query;
    if (error) throw error;

    const enriched = (data || []).map((po) => {
      const supplier = po.ro_suppliers as unknown as { name: string } | null;
      return {
        ...po,
        supplier_name: supplier?.name || "Unknown",
        ro_suppliers: undefined,
      };
    });

    return NextResponse.json(enriched);
  } catch (err) {
    console.error("GET POs error:", err);
    return NextResponse.json({ error: "Failed to fetch POs" }, { status: 500 });
  }
}

// POST /api/supply-pos/pos — create draft PO
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { supplier_id, requested_delivery_date, created_by, line_items } = body;

    if (!supplier_id || !line_items?.length) {
      return NextResponse.json(
        { error: "supplier_id and line_items are required" },
        { status: 400 }
      );
    }

    const poNumber = await generatePONumber();

    // Calculate totals
    const subtotalCents = line_items.reduce(
      (sum: number, li: { quantity: number; unit_cost_cents: number }) =>
        sum + li.quantity * li.unit_cost_cents,
      0
    );

    // Create PO
    const { data: po, error: poErr } = await supabase
      .from("ro_supply_pos")
      .insert({
        po_number: poNumber,
        supplier_id,
        status: "draft",
        requested_delivery_date: requested_delivery_date || null,
        subtotal_cents: subtotalCents,
        total_cents: subtotalCents,
        created_by: created_by || null,
      })
      .select()
      .single();

    if (poErr) throw poErr;

    // Insert line items
    const lines = line_items.map(
      (
        li: {
          sku: string;
          product_name: string;
          supplier_sku?: string;
          quantity: number;
          unit_cost_cents: number;
        },
        idx: number
      ) => ({
        supply_po_id: po.id,
        sku: li.sku,
        product_name: li.product_name || null,
        supplier_sku: li.supplier_sku || null,
        quantity: li.quantity,
        unit_cost_cents: li.unit_cost_cents,
        total_cents: li.quantity * li.unit_cost_cents,
        sort_order: idx,
      })
    );

    await supabase.from("ro_supply_po_line_items").insert(lines);

    // Event
    await supabase.from("ro_supply_po_events").insert({
      supply_po_id: po.id,
      event_type: "created",
      actor: created_by || null,
      notes: `PO ${poNumber} created with ${line_items.length} line items`,
    });

    return NextResponse.json(po, { status: 201 });
  } catch (err) {
    console.error("POST PO error:", err);
    return NextResponse.json({ error: "Failed to create PO" }, { status: 500 });
  }
}
