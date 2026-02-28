"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { QuestionMarkIcon, XMarkIcon } from "./icons";
import SidebarTooltip from "./SidebarTooltip";
import { getHelpForRoute } from "@/lib/help-content";

interface SidebarHelpButtonProps {
  collapsed: boolean;
}

export default function SidebarHelpButton({
  collapsed,
}: SidebarHelpButtonProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const helpData = getHelpForRoute(pathname);

  return (
    <>
      <div className="relative group">
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm w-full text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <QuestionMarkIcon className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Help</span>}
        </button>
        {collapsed && <SidebarTooltip label="Help" />}
      </div>

      {/* Help drawer overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Drawer */}
          <div className="relative w-full max-w-md bg-slate-900 border-l border-slate-700 shadow-2xl overflow-y-auto">
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800">
              <h2 className="text-lg font-semibold text-white">
                {helpData?.title || "Help"}
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-5">
              {helpData ? (
                <>
                  <p className="text-sm text-slate-400 mb-6">
                    {helpData.description}
                  </p>

                  <div className="space-y-5">
                    {helpData.tips.map((section, idx) => (
                      <div key={idx}>
                        <h3 className="text-sm font-medium text-white mb-2">
                          {section.heading}
                        </h3>
                        <ul className="space-y-1.5">
                          {section.items.map((item, itemIdx) => (
                            <li
                              key={itemIdx}
                              className="flex items-start gap-2 text-sm text-slate-400"
                            >
                              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-500">
                  No help content available for this page yet.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
