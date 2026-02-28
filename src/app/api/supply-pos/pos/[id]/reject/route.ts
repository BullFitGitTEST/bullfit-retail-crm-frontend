import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    await supabase.from("ro_supply_pos").update({ status: "draft" }).eq("id", id);

    await supabase.from("ro_supply_po_events").insert({
      supply_po_id: id,
      event_type: "rejected",
      notes: body.note || "PO rejected — returned to draft",
    });

    return NextResponse.json({ status: "draft" });
  } catch (err) {
    console.error("Reject PO error:", err);
    return NextResponse.json({ error: "Failed to reject" }, { status: 500 });
  }
}
