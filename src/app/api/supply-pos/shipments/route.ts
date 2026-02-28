import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";

// GET /api/supply-pos/shipments
export async function GET(req: NextRequest) {
  try {
    const poId = req.nextUrl.searchParams.get("po_id");
    let query = supabase.from("ro_supply_shipments").select("*").order("created_at", { ascending: false });
    if (poId) query = query.eq("supply_po_id", poId);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (err) {
    console.error("GET shipments error:", err);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

// POST /api/supply-pos/shipments
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data, error } = await supabase
      .from("ro_supply_shipments")
      .insert(body)
      .select()
      .single();
    if (error) throw error;

    // Log event
    await supabase.from("ro_supply_po_events").insert({
      supply_po_id: body.supply_po_id,
      event_type: "shipment_created",
      notes: `Shipment created: ${body.carrier || "Unknown carrier"} ${body.tracking_number || ""}`.trim(),
    });

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("POST shipment error:", err);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}

// PATCH /api/supply-pos/shipments
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const { data, error } = await supabase
      .from("ro_supply_shipments")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    console.error("PATCH shipment error:", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
