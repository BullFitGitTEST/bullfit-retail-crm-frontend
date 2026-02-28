"use client";

import type { ReactNode } from "react";
import { SidebarProvider, useSidebar } from "./SidebarContext";
import Sidebar from "./Sidebar";
import { Bars3Icon } from "./icons";
import Link from "next/link";

function SidebarLayoutInner({ children }: { children: ReactNode }) {
  const { collapsed, setMobileOpen } = useSidebar();

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      {/* Content area */}
      <div
        className={`flex-1 min-w-0 transition-[margin-left] duration-300 ease-in-out ${
          collapsed ? "md:ml-16" : "md:ml-60"
        }`}
      >
        {/* Mobile header */}
        <div className="sticky top-0 z-20 flex items-center gap-3 h-14 px-4 bg-slate-950 border-b border-slate-800 md:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-md p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Open navigation"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight text-white">
              BullFit
            </span>
            <span className="rounded bg-indigo-600 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
              CRM
            </span>
          </Link>
        </div>

        {/* Page content */}
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

export default function SidebarLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <SidebarLayoutInner>{children}</SidebarLayoutInner>
    </SidebarProvider>
  );
}
