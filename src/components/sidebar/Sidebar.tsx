"use client";

import Link from "next/link";
import { useSidebar } from "./SidebarContext";
import SidebarItem from "./SidebarItem";
import SidebarGroup from "./SidebarGroup";
import SidebarHelpButton from "./SidebarHelpButton";
import {
  HomeIcon,
  BuildingIcon,
  FunnelIcon,
  UserPlusIcon,
  ClipboardCheckIcon,
  PhoneIcon,
  ChartBarIcon,
  EnvelopeIcon,
  RocketIcon,
  EyeIcon,
  CubeIcon,
  TrendingUpIcon,
  TruckIcon,
  TerminalIcon,
  CogIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "./icons";

const navGroups = [
  {
    label: null,
    items: [{ href: "/", label: "Dashboard", icon: HomeIcon }],
  },
  {
    label: "CRM",
    items: [
      { href: "/accounts", label: "Accounts", icon: BuildingIcon },
      { href: "/prospects", label: "Prospects", icon: UserPlusIcon },
      { href: "/pipeline", label: "Pipeline", icon: FunnelIcon },
      { href: "/tasks", label: "Tasks", icon: ClipboardCheckIcon },
      { href: "/calls", label: "Calls", icon: PhoneIcon },
      { href: "/sequences", label: "Sequences", icon: EnvelopeIcon },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/reporting", label: "Reports", icon: ChartBarIcon },
      { href: "/growth-ops", label: "Playbook", icon: RocketIcon },
      { href: "/competitor-intel", label: "Intel", icon: EyeIcon },
      { href: "/inventory", label: "Inventory", icon: CubeIcon },
      { href: "/forecast", label: "Forecast", icon: TrendingUpIcon },
      { href: "/supply-pos", label: "Supply POs", icon: TruckIcon },
    ],
  },
  {
    label: "Admin",
    items: [
      { href: "/ops/runs", label: "Ops", icon: TerminalIcon },
      { href: "/settings", label: "Settings", icon: CogIcon },
    ],
  },
];

export default function Sidebar() {
  const { collapsed, mobileOpen, toggleCollapsed, setMobileOpen } =
    useSidebar();

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen flex flex-col bg-slate-950 border-r border-slate-800 transition-all duration-300 ease-in-out
          ${collapsed ? "w-16" : "w-60"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        {/* Logo */}
        <div
          className={`h-14 flex items-center border-b border-slate-800 shrink-0 ${
            collapsed ? "justify-center px-2" : "px-4"
          }`}
        >
          <Link
            href="/"
            className="flex items-center gap-2"
            onClick={() => setMobileOpen(false)}
          >
            {collapsed ? (
              <span className="text-xl font-bold text-white">B</span>
            ) : (
              <>
                <span className="text-xl font-bold tracking-tight text-white">
                  BullFit
                </span>
                <span className="rounded bg-indigo-600 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-white">
                  CRM
                </span>
              </>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-5 sidebar-scroll">
          {navGroups.map((group, idx) => (
            <SidebarGroup
              key={group.label || idx}
              label={group.label}
              collapsed={collapsed}
            >
              {group.items.map((item) => (
                <SidebarItem
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  collapsed={collapsed}
                  onClick={() => setMobileOpen(false)}
                />
              ))}
            </SidebarGroup>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-800 p-2 space-y-0.5 shrink-0">
          <SidebarHelpButton collapsed={collapsed} />

          {/* Collapse toggle — hidden on mobile */}
          <div className="hidden md:block">
            <div className="relative group">
              <button
                onClick={toggleCollapsed}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm w-full text-slate-400 hover:bg-slate-800 hover:text-white transition-colors ${
                  collapsed ? "justify-center px-2" : ""
                }`}
              >
                {collapsed ? (
                  <ChevronRightIcon className="h-5 w-5 shrink-0" />
                ) : (
                  <>
                    <ChevronLeftIcon className="h-5 w-5 shrink-0" />
                    <span>Collapse</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
