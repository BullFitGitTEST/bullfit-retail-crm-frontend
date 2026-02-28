import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { processReceipt } from "@/lib/supply-pos/receiving";

// GET /api/supply-pos/receipts
export async function GET(req: NextRequest) {
  try {
    const poId = req.nextUrl.searchParams.get("po_id");
    let query = supabase.from("ro_receipts").select("*").order("received_at", { ascending: false });
    if (poId) query = query.eq("supply_po_id", poId);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (err) {
    console.error("GET receipts error:", err);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

// POST /api/supply-pos/receipts — process a receipt
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await processReceipt(body);
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error("POST receipt error:", err);
    return NextResponse.json({ error: "Failed to process receipt" }, { status: 500 });
  }
}
