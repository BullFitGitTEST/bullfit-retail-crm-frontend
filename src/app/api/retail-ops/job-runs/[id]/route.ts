import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";

// GET /api/retail-ops/job-runs/[id] — get a single job run
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from("job_runs")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Job run not found" },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("GET /api/retail-ops/job-runs/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to fetch job run" },
      { status: 500 }
    );
  }
}
