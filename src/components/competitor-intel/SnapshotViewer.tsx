"use client";

import { useState } from "react";
import type { ExtractedData } from "@/lib/competitor-intel/types";

interface SnapshotViewerProps {
  isOpen: boolean;
  onClose: () => void;
  snapshot: {
    id: string;
    fetched_at: string;
    competitor_name?: string;
    source_url?: string;
    extraction_status: string;
    extracted_json: ExtractedData;
    extracted_text: string | null;
  } | null;
  previousExtracted?: ExtractedData | null;
  highlightField?: string;
}

export default function SnapshotViewer({
  isOpen,
  onClose,
  snapshot,
  previousExtracted,
  highlightField,
}: SnapshotViewerProps) {
  const [tab, setTab] = useState<"fields" | "text" | "diff">("fields");

  if (!isOpen || !snapshot) return null;

  const extracted = snapshot.extracted_json;

  const renderValue = (val: unknown): string => {
    if (val === null || val === undefined) return "null";
    if (typeof val === "object") return JSON.stringify(val, null, 2);
    return String(val);
  };

  const isHighlighted = (path: string) => highlightField === path;

  const fieldEntries = Object.entries(extracted || {});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative flex h-[80vh] w-full max-w-4xl flex-col rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Snapshot Viewer
            </h2>
            <p className="text-xs text-slate-400">
              {snapshot.competitor_name} &middot;{" "}
              {new Date(snapshot.fetched_at).toLocaleString()} &middot;{" "}
              <span className="font-mono text-slate-500">
                {snapshot.id.slice(0, 8)}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700 px-6">
          {(["fields", "text", "diff"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium capitalize ${
                tab === t
                  ? "border-b-2 border-indigo-500 text-indigo-400"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {t === "fields"
                ? "Extracted Fields"
                : t === "text"
                  ? "Raw Text"
                  : "Diff vs Previous"}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {tab === "fields" && (
            <div className="space-y-2">
              {fieldEntries.map(([key, value]) => (
                <div
                  key={key}
                  className={`rounded-lg border p-3 ${
                    isHighlighted(key)
                      ? "border-yellow-500 bg-yellow-500/10"
                      : "border-slate-700 bg-slate-800"
                  }`}
                >
                  <div className="text-xs font-mono text-slate-400 mb-1">
                    {key}
                  </div>
                  <pre className="text-sm text-white whitespace-pre-wrap">
                    {renderValue(value)}
                  </pre>
                </div>
              ))}
              {fieldEntries.length === 0 && (
                <p className="text-sm text-slate-500">
                  No extracted data available.
                </p>
              )}
            </div>
          )}

          {tab === "text" && (
            <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
              {snapshot.extracted_text
                ? snapshot.extracted_text.slice(0, 10000)
                : "No extracted text available."}
              {(snapshot.extracted_text?.length || 0) > 10000 && (
                <span className="text-slate-500">
                  {"\n\n"}... truncated ({snapshot.extracted_text?.length.toLocaleString()} chars total)
                </span>
              )}
            </pre>
          )}

          {tab === "diff" && (
            <div className="space-y-3">
              {previousExtracted ? (
                fieldEntries.map(([key, currentVal]) => {
                  const prevVal =
                    previousExtracted[key as keyof ExtractedData];
                  const changed =
                    JSON.stringify(currentVal) !== JSON.stringify(prevVal);
                  if (!changed) return null;
                  return (
                    <div
                      key={key}
                      className="rounded-lg border border-amber-600/30 bg-amber-600/5 p-3"
                    >
                      <div className="text-xs font-mono text-amber-400 mb-2">
                        {key}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-red-400 mb-1">
                            Previous
                          </div>
                          <pre className="text-xs text-slate-300 whitespace-pre-wrap">
                            {renderValue(prevVal)}
                          </pre>
                        </div>
                        <div>
                          <div className="text-xs text-green-400 mb-1">
                            Current
                          </div>
                          <pre className="text-xs text-slate-300 whitespace-pre-wrap">
                            {renderValue(currentVal)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-slate-500">
                  No previous snapshot available for comparison.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
