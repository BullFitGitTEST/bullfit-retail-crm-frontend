"use client";

interface SyncStatusBadgeProps {
  status: "success" | "failed" | "running" | "never";
  lastSync?: string | null;
}

export default function SyncStatusBadge({
  status,
  lastSync,
}: SyncStatusBadgeProps) {
  const colors = {
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    failed: "bg-red-500/10 text-red-400 border-red-500/20",
    running: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    never: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  };

  const labels = {
    success: "Synced",
    failed: "Failed",
    running: "Syncing...",
    never: "Never Synced",
  };

  function formatAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${colors[status]}`}
    >
      {status === "running" && (
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
      )}
      {status === "success" && (
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
      )}
      {status === "failed" && (
        <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
      )}
      {labels[status]}
      {lastSync && status !== "never" && (
        <span className="text-slate-500 ml-1">
          {formatAgo(lastSync)}
        </span>
      )}
    </span>
  );
}
