import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { deterministicExtract } from "@/lib/competitor-intel/extraction";
import { aiExtract, getPromptVersion } from "@/lib/competitor-intel/ai-service";

// Vercel Cron auth check
function verifyCron(req: NextRequest): boolean {
  if (!process.env.CRON_SECRET) return true;
  return req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
}

// Core logic
async function runExtraction(opts?: { snapshot_id?: string }) {
  const startedAt = new Date().toISOString();
  let runId: string | null = null;
  const snapshotId = opts?.snapshot_id;

  try {
    const { data: run } = await supabase
      .from("ci_competitor_runs")
      .insert({
        run_type: "extraction",
        started_at: startedAt,
        status: "running",
        prompt_version: getPromptVersion("extraction"),
        input_json: { snapshot_id: snapshotId },
      })
      .select("id")
      .single();

    runId = run?.id || null;

    let query = supabase
      .from("ci_competitor_snapshots")
      .select("*")
      .eq("extraction_status", "pending")
      .order("fetched_at", { ascending: true })
      .limit(20);

    if (snapshotId) {
      query = supabase
        .from("ci_competitor_snapshots")
        .select("*")
        .eq("id", snapshotId)
        .limit(1);
    }

    const { data: snapshots, error: snapError } = await query;
    if (snapError) throw snapError;

    const results: Array<{ snapshot_id: string; status: string }> = [];

    for (const snapshot of snapshots || []) {
      try {
        const rawText = snapshot.extracted_text || "";

        if (!rawText.trim()) {
          await supabase
            .from("ci_competitor_snapshots")
            .update({
              extraction_status: "failed",
              extraction_error: "No extracted text available",
            })
            .eq("id", snapshot.id);

          results.push({ snapshot_id: snapshot.id, status: "failed: no text" });
          continue;
        }

        const deterministicResult = deterministicExtract(rawText);
        const aiResult = await aiExtract(rawText, deterministicResult);

        const finalExtracted = {
          ...aiResult.output,
          price: aiResult.output.price?.amount !== null
            ? aiResult.output.price
            : deterministicResult.price || { amount: null, currency: null },
          servings: aiResult.output.servings ?? deterministicResult.servings ?? null,
          price_per_serving:
            aiResult.output.price_per_serving ??
            deterministicResult.price_per_serving ??
            null,
          promo: aiResult.output.promo?.is_present !== undefined
            ? aiResult.output.promo
            : deterministicResult.promo || { is_present: false, text: null },
          shipping_threshold:
            aiResult.output.shipping_threshold?.amount !== null
              ? aiResult.output.shipping_threshold
              : deterministicResult.shipping_threshold || { amount: null, currency: null },
          reviews: aiResult.output.reviews?.count !== null
            ? aiResult.output.reviews
            : deterministicResult.reviews || { count: null, rating: null },
        };

        await supabase
          .from("ci_competitor_snapshots")
          .update({
            extraction_status: "success",
            extracted_json: finalExtracted,
          })
          .eq("id", snapshot.id);

        results.push({ snapshot_id: snapshot.id, status: "success" });
      } catch (extractErr) {
        console.error(`Extraction failed for snapshot ${snapshot.id}:`, extractErr);

        await supabase
          .from("ci_competitor_snapshots")
          .update({
            extraction_status: "failed",
            extraction_error: extractErr instanceof Error ? extractErr.message : "Unknown error",
          })
          .eq("id", snapshot.id);

        results.push({
          snapshot_id: snapshot.id,
          status: `failed: ${extractErr instanceof Error ? extractErr.message : "unknown"}`,
        });
      }
    }

    if (runId) {
      await supabase
        .from("ci_competitor_runs")
        .update({
          finished_at: new Date().toISOString(),
          status: "success",
          model: process.env.AI_MODEL || "gpt-4o",
          output_json: { results, snapshots_processed: results.length },
        })
        .eq("id", runId);
    }

    return NextResponse.json({
      run_id: runId,
      snapshots_processed: results.length,
      results,
    });
  } catch (err) {
    console.error("extraction error:", err);

    if (runId) {
      await supabase
        .from("ci_competitor_runs")
        .update({
          finished_at: new Date().toISOString(),
          status: "failed",
          error: err instanceof Error ? err.message : "Unknown error",
        })
        .eq("id", runId);
    }

    return NextResponse.json(
      { error: "Extraction failed" },
      { status: 500 }
    );
  }
}

// GET — Vercel Cron trigger
export async function GET(req: NextRequest) {
  if (!verifyCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return runExtraction();
}

// POST — Manual trigger
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return runExtraction({ snapshot_id: body.snapshot_id });
}
