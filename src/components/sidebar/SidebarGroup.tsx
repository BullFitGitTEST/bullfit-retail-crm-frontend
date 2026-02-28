import type { ReactNode } from "react";

interface SidebarGroupProps {
  label: string | null;
  collapsed: boolean;
  children: ReactNode;
}

export default function SidebarGroup({
  label,
  collapsed,
  children,
}: SidebarGroupProps) {
  return (
    <div>
      {label && !collapsed && (
        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </p>
      )}
      {label && collapsed && (
        <div className="mx-auto w-6 border-t border-slate-700 mb-2" />
      )}
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}
