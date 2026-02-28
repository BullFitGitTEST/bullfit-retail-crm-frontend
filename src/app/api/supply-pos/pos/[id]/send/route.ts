import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: po } = await supabase
      .from("ro_supply_pos")
      .select("status, po_number")
      .eq("id", id)
      .single();

    if (!po || po.status !== "approved") {
      return NextResponse.json({ error: "PO must be approved before sending" }, { status: 400 });
    }

    // Update status to sent
    await supabase
      .from("ro_supply_pos")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
      })
      .eq("id", id);

    // TODO: Generate PDF and email supplier (requires resend + @react-pdf/renderer)
    // For now, just mark as sent

    await supabase.from("ro_supply_po_events").insert({
      supply_po_id: id,
      event_type: "sent",
      notes: `PO ${po.po_number} marked as sent to supplier`,
    });

    return NextResponse.json({ status: "sent" });
  } catch (err) {
    console.error("Send PO error:", err);
    return NextResponse.json({ error: "Failed to send PO" }, { status: 500 });
  }
}
