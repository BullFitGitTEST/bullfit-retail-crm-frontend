import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { SourceInput } from "@/lib/competitor-intel/types";

// GET /api/competitor-intel/sources?competitor_id=xxx
export async function GET(req: NextRequest) {
  try {
    const competitorId = req.nextUrl.searchParams.get("competitor_id");

    let query = supabase
      .from("ci_competitor_sources")
      .select("*")
      .order("created_at", { ascending: false });

    if (competitorId) {
      query = query.eq("competitor_id", competitorId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (err) {
    console.error("GET /api/competitor-intel/sources error:", err);
    return NextResponse.json(
      { error: "Failed to fetch sources" },
      { status: 500 }
    );
  }
}

// POST /api/competitor-intel/sources — add a source to a competitor
export async function POST(req: NextRequest) {
  try {
    const body: SourceInput = await req.json();

    if (!body.competitor_id || !body.url?.trim() || !body.source_type) {
      return NextResponse.json(
        { error: "competitor_id, source_type, and url are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("ci_competitor_sources")
      .insert({
        competitor_id: body.competitor_id,
        source_type: body.source_type,
        url: body.url.trim(),
        fetch_frequency: body.fetch_frequency || "weekly",
        is_active: body.is_active ?? true,
        notes: body.notes || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("POST /api/competitor-intel/sources error:", err);
    return NextResponse.json(
      { error: "Failed to create source" },
      { status: 500 }
    );
  }
}

// PATCH /api/competitor-intel/sources — update a source
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("ci_competitor_sources")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err) {
    console.error("PATCH /api/competitor-intel/sources error:", err);
    return NextResponse.json(
      { error: "Failed to update source" },
      { status: 500 }
    );
  }
}

// DELETE /api/competitor-intel/sources — remove a source
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("ci_competitor_sources")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/competitor-intel/sources error:", err);
    return NextResponse.json(
      { error: "Failed to delete source" },
      { status: 500 }
    );
  }
}
