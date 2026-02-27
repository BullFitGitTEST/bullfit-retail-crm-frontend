"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const opsLinks = [
  { href: "/ops/runs", label: "Job Runs" },
  { href: "/ops/data-health", label: "Data Health" },
];

export default function OpsNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-1 mb-6">
      {opsLinks.map((link) => {
        const isActive = pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
