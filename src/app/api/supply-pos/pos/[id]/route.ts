import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";

// GET /api/supply-pos/pos/[id] — PO detail with all related data
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: po, error } = await supabase
      .from("ro_supply_pos")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    const [supplier, lineItems, events, shipments] = await Promise.all([
      supabase.from("ro_suppliers").select("*").eq("id", po.supplier_id).single(),
      supabase.from("ro_supply_po_line_items").select("*").eq("supply_po_id", id).order("sort_order"),
      supabase.from("ro_supply_po_events").select("*").eq("supply_po_id", id).order("created_at", { ascending: false }),
      supabase.from("ro_supply_shipments").select("*").eq("supply_po_id", id).order("created_at", { ascending: false }),
    ]);

    return NextResponse.json({
      ...po,
      supplier: supplier.data,
      line_items: lineItems.data || [],
      events: events.data || [],
      shipments: shipments.data || [],
    });
  } catch (err) {
    console.error("GET PO detail error:", err);
    return NextResponse.json({ error: "PO not found" }, { status: 404 });
  }
}

// PATCH /api/supply-pos/pos/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const { data, error } = await supabase
      .from("ro_supply_pos")
      .update(body)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    console.error("PATCH PO error:", err);
    return NextResponse.json({ error: "Failed to update PO" }, { status: 500 });
  }
}
