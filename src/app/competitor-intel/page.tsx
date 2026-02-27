"use client";

import { useEffect, useState, useCallback } from "react";
import CompetitorIntelNav from "@/components/competitor-intel/CompetitorIntelNav";
import AddCompetitorModal from "@/components/competitor-intel/AddCompetitorModal";
import AddSourceModal from "@/components/competitor-intel/AddSourceModal";
import DiscoverCompetitorsModal from "@/components/competitor-intel/DiscoverCompetitorsModal";
import PriorityBadge from "@/components/shared/PriorityBadge";
import HelpPanel from "@/components/HelpPanel";
import {
  getCompetitors,
  createCompetitor,
  updateCompetitor,
  getSources,
  createSource,
} from "@/lib/competitor-intel/api-client";
import type {
  CompetitorWithStats,
  CompetitorSource,
  CompetitorPriority,
  SourceType,
  FetchFrequency,
} from "@/lib/competitor-intel/types";

export default function CompetitorIntelWatchlist() {
  const [competitors, setCompetitors] = useState<CompetitorWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCompetitor, setSelectedCompetitor] =
    useState<CompetitorWithStats | null>(null);
  const [sources, setSources] = useState<CompetitorSource[]>([]);
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [showDiscoverModal, setShowDiscoverModal] = useState(false);
  const [sourcesLoading, setSourcesLoading] = useState(false);

  const loadCompetitors = useCallback(async () => {
    try {
      const data = await getCompetitors();
      setCompetitors(data);
    } catch (err) {
      console.error("Failed to load competitors:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCompetitors();
  }, [loadCompetitors]);

  const loadSources = async (competitorId: string) => {
    setSourcesLoading(true);
    try {
      const data = await getSources(competitorId);
      setSources(data);
    } catch (err) {
      console.error("Failed to load sources:", err);
    } finally {
      setSourcesLoading(false);
    }
  };

  const handleAddCompetitor = async (data: {
    name: string;
    tags: string[];
    priority: CompetitorPriority;
  }) => {
    await createCompetitor(data);
    await loadCompetitors();
  };

  const handleTogglePause = async (comp: CompetitorWithStats) => {
    await updateCompetitor(comp.id, { is_active: !comp.is_active });
    await loadCompetitors();
  };

  const handleSelectCompetitor = (comp: CompetitorWithStats) => {
    setSelectedCompetitor(comp);
    loadSources(comp.id);
  };

  const handleAddSource = async (data: {
    competitor_id: string;
    source_type: SourceType;
    url: string;
    fetch_frequency: FetchFrequency;
    notes: string;
  }) => {
    await createSource(data);
    if (selectedCompetitor) {
      await loadSources(selectedCompetitor.id);
      await loadCompetitors();
    }
  };

  const formatTime = (ts: string | null) => {
    if (!ts) return "Never";
    return new Date(ts).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const sourceTypeLabel = (t: string) =>
    t
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Competitor Intel</h1>
            <p className="text-sm text-slate-400 mt-1">
              Monitor competitors, track changes, and generate actionable
              recommendations.
            </p>
          </div>
          <HelpPanel
            pageKey="competitor-intel"
            tagline="Automated competitor monitoring and intelligence"
            sections={[
              {
                title: "How It Works",
                content: [
                  "Add competitors to your watchlist, then attach sources (product pages, Amazon listings, social media) to each one.",
                  "The system periodically fetches each source, captures a snapshot, and uses AI to extract pricing, promos, messaging, and more.",
                ],
              },
              {
                title: "5 Tabs",
                content: [
                  "Watchlist — manage competitors and their sources.",
                  "Snapshots — browse all captured data points.",
                  "Comparisons — side-by-side BullFit vs competitor analysis.",
                  "Recommendations — AI-generated action items from intelligence.",
                  "Runs & Logs — transparency into every pipeline run and AI output.",
                ],
              },
              {
                title: "Key Concepts",
                content: [
                  "Change Score: how much a competitor changed in the last 7 days (0-100). Higher = more activity.",
                  "Priority: high / medium / low — set by you to focus monitoring effort.",
                  "Discover: AI-powered tool to find competitors from your existing CRM data.",
                ],
              },
            ]}
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowDiscoverModal(true)}
            className="rounded-lg border border-indigo-500/50 bg-indigo-600/10 px-4 py-2 text-sm font-medium text-indigo-300 hover:bg-indigo-600/20 flex items-center gap-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
            <span className="hidden sm:inline">Discover Competitors</span>
            <span className="sm:hidden">Discover</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            + Add
          </button>
        </div>
      </div>

      <CompetitorIntelNav />

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Competitors List */}
        <div className={`${selectedCompetitor ? "lg:w-3/5" : "w-full"} transition-all`}>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-indigo-500" />
            </div>
          ) : competitors.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-700 p-12 text-center">
              <div className="text-4xl mb-3">🔍</div>
              <h3 className="text-lg font-medium text-white mb-1">
                No competitors yet
              </h3>
              <p className="text-sm text-slate-400 mb-4">
                Add your first competitor to start monitoring.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
              >
                + Add Competitor
              </button>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-hidden rounded-xl border border-slate-700">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700 bg-slate-800/50">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                        Competitor
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                        Tags
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                        Priority
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-slate-400">
                        Sources
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                        Last Snapshot
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-slate-400">
                        Change Score
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-400">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {competitors.map((comp) => (
                      <tr
                        key={comp.id}
                        className={`transition-colors hover:bg-slate-800/50 ${
                          selectedCompetitor?.id === comp.id
                            ? "bg-slate-800"
                            : ""
                        }`}
                      >
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleSelectCompetitor(comp)}
                            className="font-medium text-white hover:text-indigo-400"
                          >
                            {comp.name}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {comp.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-300"
                              >
                                {tag}
                              </span>
                            ))}
                            {comp.tags.length > 3 && (
                              <span className="text-xs text-slate-500">
                                +{comp.tags.length - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <PriorityBadge priority={comp.priority} />
                        </td>
                        <td className="px-4 py-3 text-center text-slate-300">
                          {comp.sources_count}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs">
                          {formatTime(comp.last_snapshot_at)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${
                              comp.change_score_7d >= 50
                                ? "bg-red-600/20 text-red-300"
                                : comp.change_score_7d >= 20
                                  ? "bg-amber-600/20 text-amber-300"
                                  : "bg-slate-600/20 text-slate-400"
                            }`}
                          >
                            {comp.change_score_7d}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                              comp.is_active
                                ? "text-green-400"
                                : "text-slate-500"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                comp.is_active ? "bg-green-400" : "bg-slate-600"
                              }`}
                            />
                            {comp.is_active ? "Active" : "Paused"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleSelectCompetitor(comp)}
                              className="text-xs text-indigo-400 hover:text-indigo-300"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleTogglePause(comp)}
                              className="text-xs text-slate-400 hover:text-white"
                            >
                              {comp.is_active ? "Pause" : "Resume"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-3">
                {competitors.map((comp) => (
                  <button
                    key={comp.id}
                    onClick={() => handleSelectCompetitor(comp)}
                    className={`block w-full text-left rounded-xl border border-slate-700 bg-slate-800 p-4 hover:bg-slate-700/50 transition-colors ${
                      selectedCompetitor?.id === comp.id ? "ring-1 ring-indigo-500" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white truncate">
                          {comp.name}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {comp.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <PriorityBadge priority={comp.priority} />
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-xs">
                      <span className="text-slate-400">
                        {comp.sources_count} sources
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 font-bold ${
                          comp.change_score_7d >= 50
                            ? "bg-red-600/20 text-red-300"
                            : comp.change_score_7d >= 20
                              ? "bg-amber-600/20 text-amber-300"
                              : "bg-slate-600/20 text-slate-400"
                        }`}
                      >
                        Score: {comp.change_score_7d}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 ${
                          comp.is_active ? "text-green-400" : "text-slate-500"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            comp.is_active ? "bg-green-400" : "bg-slate-600"
                          }`}
                        />
                        {comp.is_active ? "Active" : "Paused"}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      Last snapshot: {formatTime(comp.last_snapshot_at)}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Detail Drawer */}
        {selectedCompetitor && (
          <div className="lg:w-2/5 rounded-xl border border-slate-700 bg-slate-800 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">
                {selectedCompetitor.name}
              </h2>
              <button
                onClick={() => setSelectedCompetitor(null)}
                className="rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-white"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              {selectedCompetitor.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-indigo-600/30 bg-indigo-600/10 px-2.5 py-0.5 text-xs text-indigo-300"
                >
                  {tag}
                </span>
              ))}
              <PriorityBadge priority={selectedCompetitor.priority} />
            </div>

            <div className="mb-4 grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-slate-900 p-3 text-center">
                <div className="text-lg font-bold text-white">
                  {selectedCompetitor.sources_count}
                </div>
                <div className="text-xs text-slate-400">Sources</div>
              </div>
              <div className="rounded-lg bg-slate-900 p-3 text-center">
                <div className="text-lg font-bold text-white">
                  {selectedCompetitor.change_score_7d}
                </div>
                <div className="text-xs text-slate-400">Change Score</div>
              </div>
              <div className="rounded-lg bg-slate-900 p-3 text-center">
                <div className="text-xs font-medium text-white">
                  {formatTime(selectedCompetitor.last_snapshot_at)}
                </div>
                <div className="text-xs text-slate-400 mt-1">Last Snap</div>
              </div>
            </div>

            {/* Sources List */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-slate-300">Sources</h3>
              <button
                onClick={() => setShowSourceModal(true)}
                className="rounded bg-indigo-600/20 px-2.5 py-1 text-xs font-medium text-indigo-300 hover:bg-indigo-600/30"
              >
                + Add Source
              </button>
            </div>

            {sourcesLoading ? (
              <div className="py-4 text-center text-sm text-slate-500">
                Loading sources...
              </div>
            ) : sources.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-600 p-4 text-center text-sm text-slate-500">
                No sources yet. Add one to start monitoring.
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {sources.map((source) => (
                  <div
                    key={source.id}
                    className="rounded-lg border border-slate-700 bg-slate-900 p-3"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="rounded bg-slate-700 px-2 py-0.5 text-xs font-medium text-slate-300">
                        {sourceTypeLabel(source.source_type)}
                      </span>
                      <span className="text-xs text-slate-500">
                        {source.fetch_frequency}
                      </span>
                    </div>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-400 hover:text-indigo-300 break-all"
                    >
                      {source.url}
                    </a>
                    {source.last_fetched_at && (
                      <div className="text-xs text-slate-500 mt-1">
                        Last fetched: {formatTime(source.last_fetched_at)}
                      </div>
                    )}
                    {source.notes && (
                      <div className="text-xs text-slate-500 mt-1 italic">
                        {source.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <AddCompetitorModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddCompetitor}
      />
      {selectedCompetitor && (
        <AddSourceModal
          isOpen={showSourceModal}
          competitorId={selectedCompetitor.id}
          onClose={() => setShowSourceModal(false)}
          onSubmit={handleAddSource}
        />
      )}
      <DiscoverCompetitorsModal
        isOpen={showDiscoverModal}
        onClose={() => setShowDiscoverModal(false)}
        existingCompetitorNames={competitors.map((c) => c.name)}
        onImported={loadCompetitors}
      />
    </div>
  );
}
