"use client";

import type { Citation } from "@/lib/competitor-intel/types";

interface CitationLinkProps {
  citation: Citation;
  index?: number;
}

export default function CitationLink({ citation, index }: CitationLinkProps) {
  const shortId = citation.snapshot_id.slice(0, 8);
  return (
    <a
      href={`/competitor-intel/snapshots?snapshot=${citation.snapshot_id}&highlight=${encodeURIComponent(citation.field_path)}`}
      className="inline-flex items-center gap-1 rounded bg-indigo-600/20 px-1.5 py-0.5 text-xs font-mono text-indigo-300 hover:bg-indigo-600/30 transition-colors"
      title={`Snapshot ${shortId} → ${citation.field_path}`}
    >
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.172 13.828a4 4 0 015.656 0l4-4a4 4 0 00-5.656-5.656l-1.102 1.101" />
      </svg>
      {index !== undefined ? `[${index + 1}]` : ""} {shortId}/{citation.field_path}
    </a>
  );
}
