interface SidebarTooltipProps {
  label: string;
}

export default function SidebarTooltip({ label }: SidebarTooltipProps) {
  return (
    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 delay-150 z-50">
      <div className="relative rounded-md bg-slate-800 border border-slate-700 px-3 py-1.5 text-sm text-white shadow-lg whitespace-nowrap">
        {label}
        {/* Arrow pointing left */}
        <div className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-slate-700" />
        <div className="absolute right-full top-1/2 -translate-y-1/2 border-[4px] border-transparent border-r-slate-800 ml-px" />
      </div>
    </div>
  );
}
