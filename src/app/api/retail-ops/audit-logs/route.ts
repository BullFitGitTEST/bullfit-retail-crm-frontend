import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";

// GET /api/retail-ops/audit-logs — list audit logs with optional filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const entityType = searchParams.get("entity_type");
    const entityId = searchParams.get("entity_id");
    const actor = searchParams.get("actor");
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    let query = supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (entityType) query = query.eq("entity_type", entityType);
    if (entityId) query = query.eq("entity_id", entityId);
    if (actor) query = query.eq("actor", actor);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (err) {
    console.error("GET /api/retail-ops/audit-logs error:", err);
    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}
