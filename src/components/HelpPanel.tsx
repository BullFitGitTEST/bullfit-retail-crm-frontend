"use client";

import { useState, useEffect } from "react";

interface HelpSection {
  title: string;
  content: string[];
}

interface HelpPanelProps {
  pageKey: string;
  tagline: string;
  sections: HelpSection[];
}

export default function HelpPanel({ pageKey, tagline, sections }: HelpPanelProps) {
  const storageKey = `help_dismissed_${pageKey}`;
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const val = localStorage.getItem(storageKey);
    setDismissed(val === "true");
  }, [storageKey]);

  function handleDismiss() {
    setDismissed(true);
    setOpen(false);
    localStorage.setItem(storageKey, "true");
  }

  function handleToggle() {
    if (dismissed) {
      setOpen(!open);
    } else {
      setOpen(!open);
    }
  }

  function handleReset() {
    setDismissed(false);
    localStorage.removeItem(storageKey);
  }

  return (
    <>
      {/* Help toggle button */}
      <button
        onClick={handleToggle}
        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
          open
            ? "border-indigo-500/50 bg-indigo-600/10 text-indigo-300"
            : "border-slate-700 bg-slate-800/50 text-slate-400 hover:text-white hover:border-slate-600"
        }`}
        title="How to use this section"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
        </svg>
        How it works
      </button>

      {/* Help panel */}
      {open && (
        <div className="mt-3 rounded-xl border border-indigo-500/20 bg-gradient-to-br from-slate-800 to-slate-900 p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-medium text-indigo-400 uppercase tracking-wider mb-1">How to use this section</p>
              <p className="text-sm text-slate-300 italic">{tagline}</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-slate-500 hover:text-slate-300 text-sm ml-4 flex-shrink-0"
            >
              &#10005;
            </button>
          </div>

          <div className="space-y-4">
            {sections.map((section, i) => (
              <div key={i}>
                <h4 className="text-xs font-semibold text-white uppercase tracking-wide mb-1.5">
                  {section.title}
                </h4>
                <ul className="space-y-1">
                  {section.content.map((item, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-slate-400">
                      <span className="text-indigo-500 mt-1 flex-shrink-0">&#8250;</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {!dismissed && (
            <div className="mt-4 pt-3 border-t border-slate-700/50 flex justify-end">
              <button
                onClick={handleDismiss}
                className="rounded border border-slate-600 px-3 py-1 text-xs text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
              >
                Got it, don&apos;t show automatically
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
