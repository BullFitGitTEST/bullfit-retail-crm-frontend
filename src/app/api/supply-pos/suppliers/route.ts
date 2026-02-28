import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";

// GET /api/supply-pos/suppliers
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("ro_suppliers")
      .select("*")
      .order("name");
    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (err) {
    console.error("GET suppliers error:", err);
    return NextResponse.json({ error: "Failed to fetch suppliers" }, { status: 500 });
  }
}

// POST /api/supply-pos/suppliers
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data, error } = await supabase
      .from("ro_suppliers")
      .insert({
        name: body.name,
        code: body.code || null,
        contact_name: body.contact_name || null,
        contact_email: body.contact_email || null,
        contact_phone: body.contact_phone || null,
        address: body.address || null,
        payment_terms: body.payment_terms || "Net 30",
        default_lead_time_days: body.default_lead_time_days || 30,
      })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("POST suppliers error:", err);
    return NextResponse.json({ error: "Failed to create supplier" }, { status: 500 });
  }
}
