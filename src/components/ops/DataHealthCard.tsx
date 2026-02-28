"use client";

import type { HealthIssue } from "@/lib/data-health/types";

interface DataHealthCardProps {
  issue: HealthIssue;
  isExpanded: boolean;
  onToggle: () => void;
}

const severityConfig: Record<
  string,
  { bg: string; text: string; dot: string; label: string }
> = {
  critical: {
    bg: "border-red-500/30 bg-red-500/5",
    text: "text-red-400",
    dot: "bg-red-500",
    label: "Critical",
  },
  warning: {
    bg: "border-amber-500/30 bg-amber-500/5",
    text: "text-amber-400",
    dot: "bg-amber-500",
    label: "Warning",
  },
  info: {
    bg: "border-blue-500/30 bg-blue-500/5",
    text: "text-blue-400",
    dot: "bg-blue-500",
    label: "Info",
  },
};

export default function DataHealthCard({
  issue,
  isExpanded,
  onToggle,
}: DataHealthCardProps) {
  const sev = severityConfig[issue.severity] || severityConfig.info;

  return (
    <div className={`rounded-lg border ${sev.bg}`}>
      <button
        onClick={onToggle}
        className="w-full text-left flex items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`h-2.5 w-2.5 rounded-full ${sev.dot} shrink-0`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-white">
                {issue.title}
              </span>
              <span
                className={`rounded px-1.5 py-0.5 text-xs font-medium ${sev.text}`}
              >
                {sev.label}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
              {issue.description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className={`text-lg font-semibold ${sev.text}`}>
            {issue.count}
          </span>
          <svg
            className={`h-4 w-4 text-slate-500 transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-slate-700/50 px-4 py-3">
          <p className="text-xs text-slate-400 mb-3">{issue.description}</p>

          {issue.details.length > 0 && (
            <div className="space-y-1">
              {issue.details.map((detail, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded bg-slate-800 px-3 py-2"
                >
                  <div>
                    <span className="text-xs font-medium text-white">
                      {detail.label}
                    </span>
                    {detail.sublabel && (
                      <span className="text-xs text-slate-500 ml-2">
                        {detail.sublabel}
                      </span>
                    )}
                  </div>
                  {detail.href && (
                    <a
                      href={detail.href}
                      className="text-xs text-indigo-400 hover:text-indigo-300"
                    >
                      Fix &rarr;
                    </a>
                  )}
                </div>
              ))}
              {issue.count > issue.details.length && (
                <p className="text-xs text-slate-500 pt-1">
                  ...and {issue.count - issue.details.length} more
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
