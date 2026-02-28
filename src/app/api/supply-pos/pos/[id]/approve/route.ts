import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    await supabase
      .from("ro_supply_pos")
      .update({
        status: "approved",
        approved_by: body.approved_by || null,
        approved_at: new Date().toISOString(),
      })
      .eq("id", id);

    await supabase.from("ro_supply_po_events").insert({
      supply_po_id: id,
      event_type: "approved",
      actor: body.approved_by,
      notes: body.note || "PO approved",
    });

    return NextResponse.json({ status: "approved" });
  } catch (err) {
    console.error("Approve PO error:", err);
    return NextResponse.json({ error: "Failed to approve" }, { status: 500 });
  }
}
