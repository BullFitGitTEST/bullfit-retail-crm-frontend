import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await supabase.from("ro_supply_pos").update({ status: "cancelled" }).eq("id", id);

    await supabase.from("ro_supply_po_events").insert({
      supply_po_id: id,
      event_type: "cancelled",
      notes: "PO cancelled",
    });

    await supabase.from("audit_logs").insert({
      action: "cancel_po",
      entity_type: "supply_po",
      entity_id: id,
    });

    return NextResponse.json({ status: "cancelled" });
  } catch (err) {
    console.error("Cancel PO error:", err);
    return NextResponse.json({ error: "Failed to cancel" }, { status: 500 });
  }
}
