import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";

// GET /api/supply-pos/supplier-products
export async function GET(req: NextRequest) {
  try {
    const supplierId = req.nextUrl.searchParams.get("supplier_id");
    const sku = req.nextUrl.searchParams.get("sku");

    let query = supabase.from("ro_supplier_products").select("*").order("sku");
    if (supplierId) query = query.eq("supplier_id", supplierId);
    if (sku) query = query.eq("sku", sku);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (err) {
    console.error("GET supplier-products error:", err);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

// POST /api/supply-pos/supplier-products
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data, error } = await supabase
      .from("ro_supplier_products")
      .insert(body)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("POST supplier-products error:", err);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}

// PATCH /api/supply-pos/supplier-products
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const { data, error } = await supabase
      .from("ro_supplier_products")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    console.error("PATCH supplier-products error:", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
