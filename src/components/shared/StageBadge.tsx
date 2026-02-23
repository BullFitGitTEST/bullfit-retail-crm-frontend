"use client";

const stageColors: Record<string, string> = {
  lead: "bg-blue-600/20 text-blue-300 border-blue-600/30",
  contacted: "bg-yellow-600/20 text-yellow-300 border-yellow-600/30",
  interested: "bg-purple-600/20 text-purple-300 border-purple-600/30",
  partner: "bg-green-600/20 text-green-300 border-green-600/30",
};

const stageLabels: Record<string, string> = {
  lead: "Lead",
  contacted: "Contacted",
  interested: "Interested",
  partner: "Partner",
};

export default function StageBadge({ stage }: { stage: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
        stageColors[stage] || "bg-slate-600/20 text-slate-300 border-slate-600/30"
      }`}
    >
      {stageLabels[stage] || stage}
    </span>
  );
}
