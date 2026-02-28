"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SidebarTooltip from "./SidebarTooltip";

interface SidebarItemProps {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  collapsed: boolean;
  onClick?: () => void;
}

export default function SidebarItem({
  href,
  label,
  icon: Icon,
  collapsed,
  onClick,
}: SidebarItemProps) {
  const pathname = usePathname();
  const isActive =
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <div className="relative group">
      <Link
        href={href}
        onClick={onClick}
        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          isActive
            ? "bg-indigo-600/15 text-indigo-400"
            : "text-slate-400 hover:bg-slate-800 hover:text-white"
        } ${collapsed ? "justify-center px-2" : ""}`}
      >
        <Icon
          className={`h-5 w-5 shrink-0 ${
            isActive ? "text-indigo-400" : ""
          }`}
        />
        {!collapsed && <span className="truncate">{label}</span>}
      </Link>

      {collapsed && <SidebarTooltip label={label} />}
    </div>
  );
}
