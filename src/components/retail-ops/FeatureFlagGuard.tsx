"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { FeatureFlagKey } from "@/lib/retail-ops/types";

interface FeatureFlagGuardProps {
  flag: FeatureFlagKey;
  children: ReactNode;
  /** Optional custom "coming soon" message */
  message?: string;
}

export default function FeatureFlagGuard({
  flag,
  children,
  message,
}: FeatureFlagGuardProps) {
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const res = await fetch("/api/retail-ops/feature-flags");
        if (!res.ok) {
          // If the table doesn't exist yet (migration not run), show content anyway
          setEnabled(true);
          return;
        }
        const flags = await res.json();
        const match = flags.find(
          (f: { flag_key: string }) => f.flag_key === flag
        );
        if (!cancelled) setEnabled(match?.is_enabled ?? false);
      } catch {
        // On error, default to showing content (fail open)
        if (!cancelled) setEnabled(true);
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [flag]);

  // Loading state
  if (enabled === null) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-pulse text-slate-500 text-sm">Loading...</div>
      </div>
    );
  }

  // Feature disabled — show "Coming Soon"
  if (!enabled) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="rounded-full bg-slate-800 p-6">
          <svg
            className="h-12 w-12 text-slate-500"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-white">Coming Soon</h2>
        <p className="text-slate-400 text-center max-w-md">
          {message ||
            `The ${flag.replace(/_/g, " ")} module is not yet enabled. Contact an admin to enable this feature.`}
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
