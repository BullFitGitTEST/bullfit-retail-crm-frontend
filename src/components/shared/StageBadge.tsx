"use client";

const stageColors: Record<string, string> = {
  // Legacy prospect stages
  lead: "bg-blue-600/20 text-blue-300 border-blue-600/30",
  contacted: "bg-yellow-600/20 text-yellow-300 border-yellow-600/30",
  interested: "bg-purple-600/20 text-purple-300 border-purple-600/30",
  partner: "bg-green-600/20 text-green-300 border-green-600/30",
  // 12-stage opportunity pipeline
  targeted: "bg-slate-600/20 text-slate-300 border-slate-600/30",
  contact_found: "bg-blue-600/20 text-blue-300 border-blue-600/30",
  first_touch: "bg-cyan-600/20 text-cyan-300 border-cyan-600/30",
  meeting_booked: "bg-teal-600/20 text-teal-300 border-teal-600/30",
  pitch_delivered: "bg-yellow-600/20 text-yellow-300 border-yellow-600/30",
  samples_sent: "bg-orange-600/20 text-orange-300 border-orange-600/30",
  follow_up: "bg-amber-600/20 text-amber-300 border-amber-600/30",
  vendor_setup: "bg-purple-600/20 text-purple-300 border-purple-600/30",
  authorization_pending: "bg-violet-600/20 text-violet-300 border-violet-600/30",
  po_received: "bg-indigo-600/20 text-indigo-300 border-indigo-600/30",
  on_shelf: "bg-emerald-600/20 text-emerald-300 border-emerald-600/30",
  reorder_cycle: "bg-green-600/20 text-green-300 border-green-600/30",
  closed_lost: "bg-red-600/20 text-red-300 border-red-600/30",
  on_hold: "bg-gray-600/20 text-gray-300 border-gray-600/30",
};

const stageLabels: Record<string, string> = {
  // Legacy prospect stages
  lead: "Lead",
  contacted: "Contacted",
  interested: "Interested",
  partner: "Partner",
  // 12-stage opportunity pipeline
  targeted: "Targeted",
  contact_found: "Contact Found",
  first_touch: "First Touch",
  meeting_booked: "Meeting Booked",
  pitch_delivered: "Pitch Delivered",
  samples_sent: "Samples Sent",
  follow_up: "Follow Up",
  vendor_setup: "Vendor Setup",
  authorization_pending: "Auth Pending",
  po_received: "PO Received",
  on_shelf: "On Shelf",
  reorder_cycle: "Reorder",
  closed_lost: "Closed Lost",
  on_hold: "On Hold",
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
