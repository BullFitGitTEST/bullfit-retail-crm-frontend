"use client";

import { useState } from "react";
import {
  discoverCompetitors,
  createCompetitor,
  createSource,
} from "@/lib/competitor-intel/api-client";
import type {
  CompetitorSuggestion,
  CompetitorPriority,
  SourceType,
} from "@/lib/competitor-intel/types";

interface DiscoverCompetitorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingCompetitorNames: string[];
  onImported: () => void;
}

const TAG_OPTIONS = [
  "Pre-Workout",
  "Protein",
  "Creatine",
  "Amino Acids",
  "Fat Burner",
  "Vitamins",
  "Hydration",
  "Energy",
  "Mass Gainer",
  "Greens",
];

interface EditableSuggestion extends CompetitorSuggestion {
  selected: boolean;
  selectedSourceIndexes: Set<number>;
}

export default function DiscoverCompetitorsModal({
  isOpen,
  onClose,
  existingCompetitorNames,
  onImported,
}: DiscoverCompetitorsModalProps) {
  // Phase 1 state
  const [focusContext, setFocusContext] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [discovering, setDiscovering] = useState(false);

  // Phase 2 state
  const [suggestions, setSuggestions] = useState<EditableSuggestion[]>([]);
  const [marketContext, setMarketContext] = useState("");
  const [phase, setPhase] = useState<1 | 2>(1);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<{
    success: number;
    failed: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleCategory = (cat: string) => {
    setCategoryFilter((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleDiscover = async () => {
    setDiscovering(true);
    setError(null);
    try {
      const result = await discoverCompetitors({
        focus_context: focusContext || undefined,
        category_filter: categoryFilter.length > 0 ? categoryFilter : undefined,
        exclude_names: existingCompetitorNames,
        max_suggestions: 8,
      });

      setSuggestions(
        result.suggestions.map((s) => ({
          ...s,
          selected: true,
          selectedSourceIndexes: new Set(
            s.suggested_sources.map((_, i) => i)
          ),
        }))
      );
      setMarketContext(result.market_context);
      setPhase(2);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Discovery failed. Check AI_API_KEY in Vercel env vars."
      );
    } finally {
      setDiscovering(false);
    }
  };

  const toggleSuggestion = (index: number) => {
    setSuggestions((prev) =>
      prev.map((s, i) =>
        i === index ? { ...s, selected: !s.selected } : s
      )
    );
  };

  const updateSuggestionName = (index: number, name: string) => {
    setSuggestions((prev) =>
      prev.map((s, i) => (i === index ? { ...s, name } : s))
    );
  };

  const toggleSuggestionTag = (index: number, tag: string) => {
    setSuggestions((prev) =>
      prev.map((s, i) =>
        i === index
          ? {
              ...s,
              suggested_tags: s.suggested_tags.includes(tag)
                ? s.suggested_tags.filter((t) => t !== tag)
                : [...s.suggested_tags, tag],
            }
          : s
      )
    );
  };

  const updateSuggestionPriority = (
    index: number,
    priority: CompetitorPriority
  ) => {
    setSuggestions((prev) =>
      prev.map((s, i) =>
        i === index ? { ...s, suggested_priority: priority } : s
      )
    );
  };

  const toggleSource = (suggestionIndex: number, sourceIndex: number) => {
    setSuggestions((prev) =>
      prev.map((s, i) => {
        if (i !== suggestionIndex) return s;
        const newSet = new Set(s.selectedSourceIndexes);
        if (newSet.has(sourceIndex)) {
          newSet.delete(sourceIndex);
        } else {
          newSet.add(sourceIndex);
        }
        return { ...s, selectedSourceIndexes: newSet };
      })
    );
  };

  const selectedCount = suggestions.filter((s) => s.selected).length;

  const handleImport = async () => {
    setImporting(true);
    setError(null);
    let success = 0;
    let failed = 0;

    const selected = suggestions.filter((s) => s.selected);

    for (const suggestion of selected) {
      try {
        // Create competitor
        const competitor = await createCompetitor({
          name: suggestion.name,
          tags: suggestion.suggested_tags,
          priority: suggestion.suggested_priority,
        });

        // Create selected sources
        for (const [idx, source] of suggestion.suggested_sources.entries()) {
          if (!suggestion.selectedSourceIndexes.has(idx)) continue;
          try {
            await createSource({
              competitor_id: competitor.id,
              source_type: source.source_type as SourceType,
              url: source.url,
              fetch_frequency: "weekly",
              notes: `AI-suggested: ${source.label}`,
            });
          } catch (srcErr) {
            console.error(`Failed to create source for ${suggestion.name}:`, srcErr);
          }
        }

        success++;
      } catch (err) {
        console.error(`Failed to import ${suggestion.name}:`, err);
        failed++;
      }
    }

    setImportResults({ success, failed });
    setImporting(false);

    if (success > 0) {
      onImported();
    }
  };

  const handleClose = () => {
    // Reset state
    setPhase(1);
    setFocusContext("");
    setCategoryFilter([]);
    setSuggestions([]);
    setMarketContext("");
    setImportResults(null);
    setError(null);
    onClose();
  };

  const handleRegenerate = () => {
    setPhase(1);
    setSuggestions([]);
    setMarketContext("");
    setImportResults(null);
    setError(null);
  };

  const priorityColor = (p: CompetitorPriority) => {
    switch (p) {
      case "high":
        return "border-red-500 bg-red-600/20 text-red-300";
      case "medium":
        return "border-amber-500 bg-amber-600/20 text-amber-300";
      case "low":
        return "border-slate-500 bg-slate-600/20 text-slate-300";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={handleClose} />
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <svg className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
              </svg>
              Discover Competitors
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Step {phase} of 2 &mdash;{" "}
              {phase === 1 ? "Configure discovery" : "Review suggestions"}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-white"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {phase === 1 ? (
            /* Phase 1: Configuration */
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Focus area (optional)
                </label>
                <textarea
                  value={focusContext}
                  onChange={(e) => setFocusContext(e.target.value)}
                  placeholder='e.g. "Amazon-native pre-workout brands" or "Protein brands competing at $50-60 price point"'
                  rows={3}
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Category filter (optional)
                </label>
                <div className="flex flex-wrap gap-2">
                  {TAG_OPTIONS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleCategory(tag)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        categoryFilter.includes(tag)
                          ? "border-indigo-500 bg-indigo-600/20 text-indigo-300"
                          : "border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-red-600/30 bg-red-600/10 p-3 text-sm text-red-300">
                  {error}
                </div>
              )}
            </div>
          ) : (
            /* Phase 2: Review */
            <div className="space-y-4">
              {/* Market context banner */}
              {marketContext && (
                <div className="rounded-lg border border-indigo-600/20 bg-indigo-600/5 p-3 text-sm text-slate-300">
                  <span className="text-xs font-medium text-indigo-400 uppercase tracking-wider">
                    Market Context
                  </span>
                  <p className="mt-1">{marketContext}</p>
                </div>
              )}

              {/* Import results */}
              {importResults && (
                <div
                  className={`rounded-lg border p-3 text-sm ${
                    importResults.failed > 0
                      ? "border-amber-600/30 bg-amber-600/10 text-amber-300"
                      : "border-green-600/30 bg-green-600/10 text-green-300"
                  }`}
                >
                  Added {importResults.success} competitor
                  {importResults.success !== 1 ? "s" : ""} successfully.
                  {importResults.failed > 0 &&
                    ` ${importResults.failed} failed.`}
                </div>
              )}

              {error && (
                <div className="rounded-lg border border-red-600/30 bg-red-600/10 p-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              {/* Suggestion cards */}
              {suggestions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center">
                  <p className="text-sm text-slate-400">
                    No suggestions found. Try broadening your focus area.
                  </p>
                </div>
              ) : (
                suggestions.map((suggestion, idx) => (
                  <div
                    key={idx}
                    className={`rounded-lg border p-4 transition-colors ${
                      suggestion.selected
                        ? "border-slate-600 bg-slate-800/50"
                        : "border-slate-700/50 bg-slate-900/50 opacity-50"
                    }`}
                  >
                    {/* Top row: checkbox + name + priority */}
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={suggestion.selected}
                        onChange={() => toggleSuggestion(idx)}
                        className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <input
                            type="text"
                            value={suggestion.name}
                            onChange={(e) =>
                              updateSuggestionName(idx, e.target.value)
                            }
                            className="bg-transparent text-white font-medium text-sm border-b border-transparent focus:border-indigo-500 focus:outline-none"
                          />
                          <select
                            value={suggestion.suggested_priority}
                            onChange={(e) =>
                              updateSuggestionPriority(
                                idx,
                                e.target.value as CompetitorPriority
                              )
                            }
                            className={`rounded-full border px-2 py-0.5 text-xs font-medium ${priorityColor(
                              suggestion.suggested_priority
                            )} bg-transparent focus:outline-none cursor-pointer`}
                          >
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                          </select>
                        </div>

                        {/* Reasoning */}
                        <p className="text-xs text-slate-400 italic mb-2">
                          {suggestion.reasoning}
                        </p>

                        {/* Website */}
                        <a
                          href={suggestion.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-indigo-400 hover:text-indigo-300"
                        >
                          {suggestion.website_url}
                        </a>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {TAG_OPTIONS.map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => toggleSuggestionTag(idx, tag)}
                              className={`rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors ${
                                suggestion.suggested_tags.includes(tag)
                                  ? "border-indigo-500 bg-indigo-600/20 text-indigo-300"
                                  : "border-slate-700 bg-slate-800 text-slate-500 hover:border-slate-600"
                              }`}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>

                        {/* Suggested sources */}
                        {suggestion.suggested_sources.length > 0 && (
                          <div className="mt-3 space-y-1">
                            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                              Suggested Sources
                            </span>
                            {suggestion.suggested_sources.map((source, sIdx) => (
                              <label
                                key={sIdx}
                                className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={suggestion.selectedSourceIndexes.has(sIdx)}
                                  onChange={() => toggleSource(idx, sIdx)}
                                  className="h-3 w-3 rounded border-slate-600 bg-slate-800 text-indigo-600 focus:ring-0"
                                />
                                <span className="rounded bg-slate-700 px-1.5 py-0.5 text-[10px] text-slate-300">
                                  {source.source_type.replace(/_/g, " ")}
                                </span>
                                <span className="truncate text-indigo-400/70">
                                  {source.url}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-700 px-6 py-4 flex items-center justify-between">
          {phase === 1 ? (
            <>
              <div />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDiscover}
                  disabled={discovering}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 flex items-center gap-2"
                >
                  {discovering ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                      Analyzing market...
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                      </svg>
                      Discover
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              <span className="text-sm text-slate-400">
                {selectedCount} of {suggestions.length} selected
              </span>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleRegenerate}
                  className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
                >
                  Regenerate
                </button>
                {importResults ? (
                  <button
                    onClick={handleClose}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-500"
                  >
                    Done
                  </button>
                ) : (
                  <button
                    onClick={handleImport}
                    disabled={importing || selectedCount === 0}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 flex items-center gap-2"
                  >
                    {importing ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                        Importing...
                      </>
                    ) : (
                      `Add ${selectedCount} Competitor${selectedCount !== 1 ? "s" : ""}`
                    )}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
