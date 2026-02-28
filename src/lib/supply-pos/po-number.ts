/**
 * Generate PO numbers in format: PO-YYYYMM-NNN
 */

import { supabaseAdmin as supabase } from "@/lib/supabase";

export async function generatePONumber(): Promise<string> {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const prefix = `PO-${yearMonth}-`;

  // Find highest existing number for this month
  const { data } = await supabase
    .from("ro_supply_pos")
    .select("po_number")
    .like("po_number", `${prefix}%`)
    .order("po_number", { ascending: false })
    .limit(1)
    .single();

  let nextNum = 1;
  if (data?.po_number) {
    const lastNum = parseInt(data.po_number.split("-").pop() || "0", 10);
    nextNum = lastNum + 1;
  }

  return `${prefix}${String(nextNum).padStart(3, "0")}`;
}
