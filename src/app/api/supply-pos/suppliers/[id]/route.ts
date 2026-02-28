import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";

// GET /api/supply-pos/suppliers/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data, error } = await supabase
      .from("ro_suppliers")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    console.error("GET supplier error:", err);
    return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
  }
}

// PATCH /api/supply-pos/suppliers/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { data, error } = await supabase
      .from("ro_suppliers")
      .update(body)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    console.error("PATCH supplier error:", err);
    return NextResponse.json({ error: "Failed to update supplier" }, { status: 500 });
  }
}
