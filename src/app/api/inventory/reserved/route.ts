import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";

// GET /api/inventory/reserved
export async function GET(req: NextRequest) {
  try {
    const sku = req.nextUrl.searchParams.get("sku");
    const activeOnly = req.nextUrl.searchParams.get("active_only") !== "false";

    let query = supabase
      .from("ro_reserved_inventory")
      .select("*")
      .order("created_at", { ascending: false });

    if (sku) query = query.eq("sku", sku);
    if (activeOnly) query = query.eq("is_active", true);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (err) {
    console.error("GET /api/inventory/reserved error:", err);
    return NextResponse.json(
      { error: "Failed to fetch reservations" },
      { status: 500 }
    );
  }
}

// POST /api/inventory/reserved
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sku, reason_type, reason_ref, units, expires_at, reserved_by } = body;

    if (!sku || !reason_type || !units) {
      return NextResponse.json(
        { error: "sku, reason_type, and units are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("ro_reserved_inventory")
      .insert({
        sku,
        reason_type,
        reason_ref: reason_ref || {},
        units,
        expires_at: expires_at || null,
        reserved_by: reserved_by || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("POST /api/inventory/reserved error:", err);
    return NextResponse.json(
      { error: "Failed to create reservation" },
      { status: 500 }
    );
  }
}

// PATCH /api/inventory/reserved
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("ro_reserved_inventory")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    console.error("PATCH /api/inventory/reserved error:", err);
    return NextResponse.json(
      { error: "Failed to update reservation" },
      { status: 500 }
    );
  }
}
