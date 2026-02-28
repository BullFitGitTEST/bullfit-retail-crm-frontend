/**
 * Receiving logic — validate receipt, update line quantities, flip PO status.
 */

import { supabaseAdmin as supabase } from "@/lib/supabase";

interface ReceiptInput {
  supply_po_id: string;
  shipment_id?: string;
  received_by?: string;
  location_id?: string;
  lines: Array<{
    supply_po_line_item_id: string;
    sku: string;
    quantity_received: number;
    quantity_damaged?: number;
  }>;
}

export async function processReceipt(input: ReceiptInput) {
  // Create receipt
  const { data: receipt, error: receiptErr } = await supabase
    .from("ro_receipts")
    .insert({
      supply_po_id: input.supply_po_id,
      shipment_id: input.shipment_id || null,
      received_by: input.received_by || null,
      location_id: input.location_id || null,
    })
    .select("id")
    .single();

  if (receiptErr) throw receiptErr;
  const receiptId = receipt.id;

  // Insert receipt lines
  const receiptLines = input.lines.map((line) => ({
    receipt_id: receiptId,
    supply_po_line_item_id: line.supply_po_line_item_id,
    sku: line.sku,
    quantity_received: line.quantity_received,
    quantity_damaged: line.quantity_damaged || 0,
  }));

  const { error: linesErr } = await supabase
    .from("ro_receipt_line_items")
    .insert(receiptLines);

  if (linesErr) throw linesErr;

  // Update PO line items received_quantity
  for (const line of input.lines) {
    // Get current received quantity
    const { data: existing } = await supabase
      .from("ro_supply_po_line_items")
      .select("received_quantity")
      .eq("id", line.supply_po_line_item_id)
      .single();

    const newReceived =
      (existing?.received_quantity || 0) + line.quantity_received;

    await supabase
      .from("ro_supply_po_line_items")
      .update({ received_quantity: newReceived })
      .eq("id", line.supply_po_line_item_id);
  }

  // Check if all lines are fully received → flip PO status
  const { data: poLines } = await supabase
    .from("ro_supply_po_line_items")
    .select("quantity, received_quantity")
    .eq("supply_po_id", input.supply_po_id);

  const allReceived = (poLines || []).every(
    (l) => l.received_quantity >= l.quantity
  );
  const anyReceived = (poLines || []).some((l) => l.received_quantity > 0);

  const newStatus = allReceived
    ? "received"
    : anyReceived
      ? "partially_received"
      : undefined;

  if (newStatus) {
    await supabase
      .from("ro_supply_pos")
      .update({ status: newStatus })
      .eq("id", input.supply_po_id);
  }

  // Log event
  await supabase.from("ro_supply_po_events").insert({
    supply_po_id: input.supply_po_id,
    event_type: allReceived ? "received" : "partially_received",
    actor: input.received_by || null,
    notes: `Received ${input.lines.length} line items`,
    metadata_json: {
      receipt_id: receiptId,
      lines: input.lines.map((l) => ({
        sku: l.sku,
        qty: l.quantity_received,
        damaged: l.quantity_damaged || 0,
      })),
    },
  });

  // Audit log
  await supabase.from("audit_logs").insert({
    actor: input.received_by || null,
    action: "receive_po",
    entity_type: "supply_po",
    entity_id: input.supply_po_id,
    metadata: { receipt_id: receiptId, status: newStatus },
  });

  return { receipt_id: receiptId, new_status: newStatus };
}
