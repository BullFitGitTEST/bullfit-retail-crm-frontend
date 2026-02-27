import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { stripHtml, computeContentHash } from "@/lib/competitor-intel/extraction";

const FETCH_TIMEOUT_MS = 30_000;
const MAX_HTML_SIZE = 5_000_000; // 5MB
const MAX_TEXT_SIZE = 50_000; // 50k chars for extracted_text

// Vercel Cron auth check
function verifyCron(req: NextRequest): boolean {
  if (!process.env.CRON_SECRET) return true;
  return req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
}

// Core logic — used by both GET (Vercel Cron) and POST (manual trigger)
async function runSnapshotFetch(opts?: {
  competitor_id?: string;
  source_id?: string;
}) {
  const startedAt = new Date().toISOString();
  let runId: string | null = null;
  const forceCompetitorId = opts?.competitor_id;
  const forceSourceId = opts?.source_id;

  try {
    // Create run log
    const { data: run } = await supabase
      .from("ci_competitor_runs")
      .insert({
        run_type: "snapshot_fetch",
        competitor_id: forceCompetitorId || null,
        source_id: forceSourceId || null,
        started_at: startedAt,
        status: "running",
        input_json: { force_competitor_id: forceCompetitorId, force_source_id: forceSourceId },
      })
      .select("id")
      .single();

    runId = run?.id || null;

    // Get sources to fetch
    let query = supabase
      .from("ci_competitor_sources")
      .select("*, ci_competitors!inner(name, is_active)")
      .eq("is_active", true);

    if (forceSourceId) {
      query = query.eq("id", forceSourceId);
    } else if (forceCompetitorId) {
      query = query.eq("competitor_id", forceCompetitorId);
    }

    const { data: sources, error: sourcesError } = await query;
    if (sourcesError) throw sourcesError;

    const activeSources = (sources || []).filter((s) => {
      const comp = s.ci_competitors as { name: string; is_active: boolean };
      if (!comp?.is_active) return false;
      if (forceSourceId || forceCompetitorId) return true;
      if (!s.last_fetched_at) return true;

      const lastFetched = new Date(s.last_fetched_at);
      const now = new Date();
      const hoursSince = (now.getTime() - lastFetched.getTime()) / (1000 * 60 * 60);

      if (s.fetch_frequency === "daily" && hoursSince >= 20) return true;
      if (s.fetch_frequency === "weekly" && hoursSince >= 144) return true;
      return false;
    });

    const results: Array<{ source_id: string; snapshot_id: string | null; status: string }> = [];

    for (const source of activeSources) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

        const response = await fetch(source.url, {
          signal: controller.signal,
          headers: {
            "User-Agent":
              "BullFit-Intel-Bot/1.0 (internal competitive intelligence; contact: tech@bullfit.com)",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          },
        });
        clearTimeout(timeout);

        const httpStatus = response.status;
        const rawHtml = (await response.text()).slice(0, MAX_HTML_SIZE);
        const contentHash = await computeContentHash(rawHtml);

        const { data: lastSnapshot } = await supabase
          .from("ci_competitor_snapshots")
          .select("id, content_hash")
          .eq("source_id", source.id)
          .order("fetched_at", { ascending: false })
          .limit(1)
          .single();

        if (lastSnapshot?.content_hash === contentHash) {
          await supabase
            .from("ci_competitor_sources")
            .update({ last_fetched_at: new Date().toISOString() })
            .eq("id", source.id);

          results.push({ source_id: source.id, snapshot_id: null, status: "unchanged" });
          continue;
        }

        const extractedText = stripHtml(rawHtml).slice(0, MAX_TEXT_SIZE);
        const snapshotId = crypto.randomUUID();
        const storagePath = `${source.competitor_id}/${source.id}/${snapshotId}.html`;

        const { error: storageError } = await supabase.storage
          .from("competitor-snapshots")
          .upload(storagePath, rawHtml, {
            contentType: "text/html",
            upsert: false,
          });

        if (storageError) {
          console.error("Storage upload error:", storageError);
        }

        const { data: snapshot, error: snapshotError } = await supabase
          .from("ci_competitor_snapshots")
          .insert({
            id: snapshotId,
            competitor_id: source.competitor_id,
            source_id: source.id,
            http_status: httpStatus,
            content_hash: contentHash,
            raw_html_storage_path: storagePath,
            extracted_text: extractedText,
            extraction_status: "pending",
            extracted_json: {},
          })
          .select("id")
          .single();

        if (snapshotError) throw snapshotError;

        await supabase
          .from("ci_competitor_sources")
          .update({ last_fetched_at: new Date().toISOString() })
          .eq("id", source.id);

        results.push({
          source_id: source.id,
          snapshot_id: snapshot?.id || snapshotId,
          status: "fetched",
        });
      } catch (fetchErr) {
        console.error(`Failed to fetch source ${source.id}:`, fetchErr);
        results.push({
          source_id: source.id,
          snapshot_id: null,
          status: `error: ${fetchErr instanceof Error ? fetchErr.message : "unknown"}`,
        });
      }
    }

    if (runId) {
      await supabase
        .from("ci_competitor_runs")
        .update({
          finished_at: new Date().toISOString(),
          status: "success",
          output_json: { results, sources_checked: activeSources.length },
        })
        .eq("id", runId);
    }

    return NextResponse.json({
      run_id: runId,
      sources_checked: activeSources.length,
      results,
    });
  } catch (err) {
    console.error("snapshot-fetch error:", err);

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
      { error: "Snapshot fetch failed" },
      { status: 500 }
    );
  }
}

// GET — Vercel Cron trigger
export async function GET(req: NextRequest) {
  if (!verifyCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return runSnapshotFetch();
}

// POST — Manual trigger with optional body params
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return runSnapshotFetch({
    competitor_id: body.competitor_id,
    source_id: body.source_id,
  });
}
