import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";

// GET /api/forecast/opportunity-sku-lines
export async function GET(req: NextRequest) {
  try {
    const oppId = req.nextUrl.searchParams.get("opportunity_id");
    const sku = req.nextUrl.searchParams.get("sku");

    let query = supabase
      .from("ro_opportunity_sku_lines")
      .select("*")
      .order("created_at", { ascending: false });

    if (oppId) query = query.eq("opportunity_id", oppId);
    if (sku) query = query.eq("sku", sku);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (err) {
    console.error("GET opportunity-sku-lines error:", err);
    return NextResponse.json(
      { error: "Failed to fetch opportunity SKU lines" },
      { status: 500 }
    );
  }
}

// POST /api/forecast/opportunity-sku-lines
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { opportunity_id, sku, product_name, expected_units, probability_override, notes } = body;

    if (!opportunity_id || !sku) {
      return NextResponse.json(
        { error: "opportunity_id and sku are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("ro_opportunity_sku_lines")
      .insert({
        opportunity_id,
        sku,
        product_name: product_name || null,
        expected_units: expected_units || 0,
        probability_override: probability_override ?? null,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("POST opportunity-sku-lines error:", err);
    return NextResponse.json(
      { error: "Failed to create opportunity SKU line" },
      { status: 500 }
    );
  }
}

// PATCH /api/forecast/opportunity-sku-lines
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("ro_opportunity_sku_lines")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    console.error("PATCH opportunity-sku-lines error:", err);
    return NextResponse.json(
      { error: "Failed to update opportunity SKU line" },
      { status: 500 }
    );
  }
}

// DELETE /api/forecast/opportunity-sku-lines
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("ro_opportunity_sku_lines")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE opportunity-sku-lines error:", err);
    return NextResponse.json(
      { error: "Failed to delete opportunity SKU line" },
      { status: 500 }
    );
  }
}
