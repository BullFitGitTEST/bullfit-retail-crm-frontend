import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";

// GET /api/competitor-intel/snapshots/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from("ci_competitor_snapshots")
      .select(`
        *,
        ci_competitors(name),
        ci_ci_competitor_sources(url, source_type)
      `)
      .eq("id", id)
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: "Snapshot not found" }, { status: 404 });
    }

    const comp = data.ci_competitors as unknown as { name: string } | null;
    const src = data.ci_competitor_sources as unknown as {
      url: string;
      source_type: string;
    } | null;

    return NextResponse.json({
      ...data,
      competitor_name: comp?.name || "Unknown",
      source_url: src?.url || "",
      source_type: src?.source_type || "",
      ci_competitors: undefined,
      ci_competitor_sources: undefined,
    });
  } catch (err) {
    console.error("GET /api/competitor-intel/snapshots/[id] error:", err);
    return NextResponse.json({ error: "Failed to fetch snapshot" }, { status: 500 });
  }
}
