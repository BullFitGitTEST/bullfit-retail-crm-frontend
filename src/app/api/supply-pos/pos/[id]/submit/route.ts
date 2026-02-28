import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";

// POST /api/supply-pos/pos/[id]/submit — submit for approval
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: po } = await supabase
      .from("ro_supply_pos")
      .select("status, total_cents, po_number")
      .eq("id", id)
      .single();

    if (!po || po.status !== "draft") {
      return NextResponse.json({ error: "PO must be in draft status" }, { status: 400 });
    }

    // Check approval threshold
    const { data: threshold } = await supabase
      .from("ro_settings_finance")
      .select("value")
      .eq("key", "po_approval_threshold_cents")
      .single();

    const thresholdCents = threshold?.value ? Number(threshold.value) : 500000;
    const needsApproval = po.total_cents >= thresholdCents;

    const newStatus = needsApproval ? "pending_approval" : "approved";

    await supabase.from("ro_supply_pos").update({ status: newStatus }).eq("id", id);

    await supabase.from("ro_supply_po_events").insert({
      supply_po_id: id,
      event_type: "submitted",
      notes: needsApproval
        ? `PO ${po.po_number} submitted for approval (total: $${(po.total_cents / 100).toFixed(2)})`
        : `PO ${po.po_number} auto-approved (below threshold)`,
    });

    return NextResponse.json({ status: newStatus, needs_approval: needsApproval });
  } catch (err) {
    console.error("Submit PO error:", err);
    return NextResponse.json({ error: "Failed to submit PO" }, { status: 500 });
  }
}
