"use client";

const priorityColors: Record<string, string> = {
  low: "bg-slate-600/20 text-slate-300 border-slate-600/30",
  medium: "bg-blue-600/20 text-blue-300 border-blue-600/30",
  high: "bg-orange-600/20 text-orange-300 border-orange-600/30",
  urgent: "bg-red-600/20 text-red-300 border-red-600/30",
};

export default function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${
        priorityColors[priority] || priorityColors.medium
      }`}
    >
      {priority}
    </span>
  );
}
