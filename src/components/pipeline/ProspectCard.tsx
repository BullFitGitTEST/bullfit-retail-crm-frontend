"use client";

import { useDraggable } from "@dnd-kit/core";
import Link from "next/link";
import type { Prospect } from "@/lib/api";

interface ProspectCardProps {
  prospect: Prospect;
  isDragging?: boolean;
}

const storeTypeIcons: Record<string, string> = {
  pharmacy: "Rx",
  health_food: "HF",
  gym: "GY",
  supplement: "SP",
  grocery: "GR",
  other: "OT",
};

export default function ProspectCard({ prospect, isDragging }: ProspectCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: prospect.id,
  });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`rounded-lg border border-slate-700 bg-slate-800 p-3 cursor-grab transition-all hover:border-slate-600 ${
        isDragging ? "opacity-90 shadow-xl ring-2 ring-indigo-500/50 rotate-2" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <Link
            href={`/prospects/${prospect.id}`}
            className="text-sm font-medium text-white hover:text-indigo-400 transition-colors block truncate"
            onClick={(e) => e.stopPropagation()}
          >
            {prospect.business_name}
          </Link>
          {(prospect.contact_first_name || prospect.contact_last_name) && (
            <p className="mt-0.5 text-xs text-slate-400 truncate">
              {prospect.contact_first_name} {prospect.contact_last_name}
            </p>
          )}
        </div>
        <span className="flex-shrink-0 rounded bg-slate-700 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 uppercase">
          {storeTypeIcons[prospect.store_type] || "OT"}
        </span>
      </div>

      {/* Bottom info */}
      <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
        {prospect.city && prospect.state && (
          <span>{prospect.city}, {prospect.state}</span>
        )}
        {prospect.phone && (
          <span className="truncate">{prospect.phone}</span>
        )}
      </div>
    </div>
  );
}
