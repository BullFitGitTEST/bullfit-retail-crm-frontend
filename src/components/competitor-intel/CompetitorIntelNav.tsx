"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/competitor-intel", label: "Watchlist", exact: true },
  { href: "/competitor-intel/snapshots", label: "Snapshots" },
  { href: "/competitor-intel/comparisons", label: "Comparisons" },
  { href: "/competitor-intel/recommendations", label: "Recommendations" },
  { href: "/competitor-intel/logs", label: "Runs & Logs" },
];

export default function CompetitorIntelNav() {
  const pathname = usePathname();

  const isActive = (tab: (typeof tabs)[number]) => {
    if (tab.exact) return pathname === tab.href;
    return pathname.startsWith(tab.href);
  };

  return (
    <div className="flex gap-1 border-b border-slate-700 mb-6 overflow-x-auto">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
            isActive(tab)
              ? "border-b-2 border-indigo-500 text-indigo-400"
              : "text-slate-400 hover:text-white"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
