"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const settingsLinks = [
  { href: "/settings", label: "General", exact: true },
  { href: "/settings/integrations/shopify", label: "Shopify" },
  { href: "/settings/procurement", label: "Procurement" },
  { href: "/settings/forecast", label: "Forecast" },
  { href: "/settings/finance", label: "Finance" },
];

export default function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-1 mb-6">
      {settingsLinks.map((link) => {
        const isActive = link.exact
          ? pathname === link.href
          : pathname.startsWith(link.href);

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
