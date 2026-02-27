"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import CompetitorIntelNav from "@/components/competitor-intel/CompetitorIntelNav";
import SnapshotViewer from "@/components/competitor-intel/SnapshotViewer";
import HelpPanel from "@/components/HelpPanel";
import {
  getSnapshots,
  getCompetitors,
  getSnapshot,
} from "@/lib/competitor-intel/api-client";
import type {
  SnapshotWithDetails,
  CompetitorWithStats,
  CompetitorSnapshot,
  ExtractedData,
} from "@/lib/competitor-intel/types";

const SOURCE_TYPE_OPTIONS = [
  { value: "", label: "All Source Types" },
  { value: "website_pdp", label: "Website PDP" },
  { value: "website_collection", label: "Website Collection" },
  { value: "pricing_page", label: "Pricing Page" },
  { value: "amazon_listing", label: "Amazon Listing" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "press", label: "Press" },
];

export default function SnapshotsPage() {
  return (
    <Suspense fallback={<div className="text-slate-400 py-12 text-center">Loading snapshots...</div>}>
      <SnapshotsContent />
    </Suspense>
  );
}

function SnapshotsContent() {
  const searchParams = useSearchParams();
  const highlightSnapshot = searchParams.get("snapshot");
  const highlightField = searchParams.get("highlight");

  const [snapshots, setSnapshots] = useState<SnapshotWithDetails[]>([]);
  const [competitors, setCompetitors] = useState<CompetitorWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterCompetitor, setFilterCompetitor] = useState("");
  const [filterSourceType, setFilterSourceType] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  // Viewer
  const [viewerSnapshot, setViewerSnapshot] =
    useState<CompetitorSnapshot | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [snaps, comps] = await Promise.all([
        getSnapshots({
          competitor_id: filterCompetitor || undefined,
          source_type: filterSourceType || undefined,
          from_date: filterFrom || undefined,
          to_date: filterTo || undefined,
        }),
        getCompetitors(),
      ]);
      setSnapshots(snaps);
      setCompetitors(comps);

      // Auto-open viewer if snapshot param is present
      if (highlightSnapshot) {
        const snap = await getSnapshot(highlightSnapshot);
        if (snap) {
          setViewerSnapshot(snap);
          setViewerOpen(true);
        }
      }
    } catch (err) {
      console.error("Failed to load snapshots:", err);
    } finally {
      setLoading(false);
    }
  }, [filterCompetitor, filterSourceType, filterFrom, filterTo, highlightSnapshot]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleViewSnapshot = async (snap: SnapshotWithDetails) => {
    try {
      const full = await getSnapshot(snap.id);
      setViewerSnapshot(full);
      setViewerOpen(true);
    } catch {
      // fallback to list data
      setViewerSnapshot(snap as unknown as CompetitorSnapshot);
      setViewerOpen(true);
    }
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      success: "bg-green-600/20 text-green-300 border-green-600/30",
      failed: "bg-red-600/20 text-red-300 border-red-600/30",
      pending: "bg-amber-600/20 text-amber-300 border-amber-600/30",
    };
    return (
      <span
        className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${
          styles[status] || styles.pending
        }`}
      >
        {status}
      </span>
    );
  };

  const summarizeExtracted = (json: Record<string, unknown> | ExtractedData) => {
    const parts: string[] = [];
    if (json.price && typeof json.price === "object") {
      const p = json.price as { amount: number | null };
      if (p.amount !== null) parts.push(`$${p.amount}`);
    }
    if (json.servings) parts.push(`${json.servings} servings`);
    if (json.promo && typeof json.promo === "object") {
      const pr = json.promo as { is_present: boolean };
      if (pr.is_present) parts.push("Promo active");
    }
    return parts.length > 0 ? parts.join(" | ") : "—";
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Snapshots</h1>
          <p className="text-sm text-slate-400 mt-1">
            Ground truth captures and extracted data from competitor sources.
          </p>
        </div>
        <HelpPanel
          pageKey="competitor-intel-snapshots"
          tagline="Point-in-time captures of competitor web pages"
          sections={[
            {
              title: "What are Snapshots?",
              content: [
                "Each snapshot is an automated capture of a competitor's web page (Amazon listing, product page, pricing page, social media).",
                "The system fetches the page, then AI extracts structured data: price, servings, promo status, key messaging, and review scores.",
              ],
            },
            {
              title: "How to use this page",
              content: [
                "Filter by competitor, source type, or date range to find specific captures.",
                "Click 'View' on any snapshot to see the full extracted data and raw text.",
                "Key Fields column shows a quick summary: price, servings, and whether a promo is active.",
              ],
            },
            {
              title: "How Snapshots connect to other tabs",
              content: [
                "Comparisons tab uses snapshot data for side-by-side BullFit vs competitor analysis.",
                "Recommendations tab generates action items based on what changed across snapshots over time.",
                "Snapshots = evidence, Comparisons = analysis, Recommendations = actions.",
              ],
            },
          ]}
        />
      </div>

      <CompetitorIntelNav />

      {/* Filters */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-end">
        <div>
          <label className="block text-xs text-slate-400 mb-1">
            Competitor
          </label>
          <select
            value={filterCompetitor}
            onChange={(e) => setFilterCompetitor(e.target.value)}
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="">All Competitors</option>
            {competitors.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">
            Source Type
          </label>
          <select
            value={filterSourceType}
            onChange={(e) => setFilterSourceType(e.target.value)}
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
          >
            {SOURCE_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">From</label>
          <input
            type="date"
            value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)}
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">To</label>
          <input
            type="date"
            value={filterTo}
            onChange={(e) => setFilterTo(e.target.value)}
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Snapshots List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-indigo-500" />
        </div>
      ) : snapshots.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700 p-12 text-center">
          <h3 className="text-lg font-medium text-white mb-1">
            No snapshots found
          </h3>
          <p className="text-sm text-slate-400">
            Snapshots will appear here after the fetcher runs.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-hidden rounded-xl border border-slate-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-800/50">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                    Fetched
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                    Competitor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                    URL
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-slate-400">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                    Key Fields
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-400">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {snapshots.map((snap) => (
                  <tr
                    key={snap.id}
                    className={`hover:bg-slate-800/50 ${
                      highlightSnapshot === snap.id ? "bg-indigo-900/20" : ""
                    }`}
                  >
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                      {new Date(snap.fetched_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 text-white">
                      {snap.competitor_name}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-slate-700 px-2 py-0.5 text-xs text-slate-300">
                        {snap.source_type?.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate">
                      <a
                        href={snap.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-400 hover:text-indigo-300"
                      >
                        {snap.source_url}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {statusBadge(snap.extraction_status)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-300">
                      {summarizeExtracted(snap.extracted_json)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleViewSnapshot(snap)}
                        className="text-xs text-indigo-400 hover:text-indigo-300"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {snapshots.map((snap) => (
              <button
                key={snap.id}
                onClick={() => handleViewSnapshot(snap)}
                className={`block w-full text-left rounded-xl border border-slate-700 bg-slate-800 p-4 hover:bg-slate-700/50 transition-colors ${
                  highlightSnapshot === snap.id ? "ring-1 ring-indigo-500" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white">{snap.competitor_name}</p>
                    <span className="mt-1 inline-block rounded bg-slate-700 px-2 py-0.5 text-xs text-slate-300">
                      {snap.source_type?.replace(/_/g, " ")}
                    </span>
                  </div>
                  {statusBadge(snap.extraction_status)}
                </div>
                <p className="mt-2 text-xs text-indigo-400 truncate">{snap.source_url}</p>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    {new Date(snap.fetched_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="text-slate-300">{summarizeExtracted(snap.extracted_json)}</span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Snapshot Viewer */}
      <SnapshotViewer
        isOpen={viewerOpen}
        onClose={() => {
          setViewerOpen(false);
          setViewerSnapshot(null);
        }}
        snapshot={
          viewerSnapshot
            ? {
                id: viewerSnapshot.id,
                fetched_at: viewerSnapshot.fetched_at,
                competitor_name: viewerSnapshot.competitor_name,
                source_url: viewerSnapshot.source_url,
                extraction_status: viewerSnapshot.extraction_status,
                extracted_json: viewerSnapshot.extracted_json,
                extracted_text: viewerSnapshot.extracted_text,
              }
            : null
        }
        highlightField={highlightField || undefined}
      />
    </div>
  );
}
