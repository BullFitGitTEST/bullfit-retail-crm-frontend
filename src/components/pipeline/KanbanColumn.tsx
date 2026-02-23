"use client";

import { useDroppable } from "@dnd-kit/core";
import type { Prospect } from "@/lib/api";
import ProspectCard from "./ProspectCard";

interface KanbanColumnProps {
  id: string;
  label: string;
  color: string;
  prospects: Prospect[];
}

export default function KanbanColumn({
  id,
  label,
  color,
  prospects,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-xl border-t-2 ${color} bg-slate-800/50 p-3 transition-colors ${
        isOver ? "bg-slate-700/50 ring-2 ring-indigo-500/30" : ""
      }`}
    >
      {/* Column Header */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">{label}</h3>
        <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs font-medium text-slate-300">
          {prospects.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 space-y-2 overflow-y-auto">
        {prospects.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-600 p-4 text-center text-xs text-slate-500">
            Drop prospects here
          </div>
        ) : (
          prospects.map((prospect) => (
            <ProspectCard key={prospect.id} prospect={prospect} />
          ))
        )}
      </div>
    </div>
  );
}
