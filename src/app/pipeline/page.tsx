"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  getOpportunityPipeline,
  moveOpportunityStage,
  OPPORTUNITY_STAGES,
} from "@/lib/api";
import type { Opportunity, OpportunityPipelineView, OpportunityStage, StageGateError } from "@/lib/api";
import HelpPanel from "@/components/HelpPanel";

type PipelineFilter = "all" | "stalled" | "no_next_step";

function PipelineContent() {
  const searchParams = useSearchParams();
  const urlFilter = searchParams.get("filter") as PipelineFilter | null;

  const [pipeline, setPipeline] = useState<OpportunityPipelineView>({});
  const [loading, setLoading] = useState(true);
  const [dragItem, setDragItem] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [gateToast, setGateToast] = useState<{ oppTitle: string; missing: StageGateError["missing_requirements"] } | null>(null);
  const [activeFilter, setActiveFilter] = useState<PipelineFilter>(
    () => (urlFilter === "stalled" || urlFilter === "no_next_step") ? urlFilter : "all"
  );

  const fetchPipeline = useCallback(async () => {
    try {
      const data = await getOpportunityPipeline();
      setPipeline(data);
    } catch (err) {
      console.error("Failed to fetch pipeline", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPipeline();
  }, [fetchPipeline]);

  // Stalled detection: updated_at > 14 days ago
  const STALL_DAYS = 14;
  const stallCutoff = new Date();
  stallCutoff.setDate(stallCutoff.getDate() - STALL_DAYS);
  const stallCutoffISO = stallCutoff.toISOString();

  function isStalled(opp: Opportunity): boolean {
    return opp.updated_at < stallCutoffISO;
  }

  function isMissingNextStep(opp: Opportunity): boolean {
    return !opp.next_step_date;
  }

  function shouldShow(opp: Opportunity): boolean {
    if (activeFilter === "stalled") return isStalled(opp);
    if (activeFilter === "no_next_step") return isMissingNextStep(opp);
    return true;
  }

  // Counts for badges
  const allOpps = Object.values(pipeline).flat();
  const stalledCount = allOpps.filter(isStalled).length;
  const noNextStepCount = allOpps.filter(isMissingNextStep).length;

  function handleDragStart(e: React.DragEvent, oppId: string) {
    setDragItem(oppId);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: React.DragEvent, stageId: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStage(stageId);
  }

  function handleDragLeave() {
    setDragOverStage(null);
  }

  async function handleDrop(e: React.DragEvent, newStage: string) {
    e.preventDefault();
    setDragOverStage(null);

    if (!dragItem) return;

    let currentStage = "";
    let opp: Opportunity | undefined;
    for (const [stage, opps] of Object.entries(pipeline)) {
      const found = opps.find((o) => o.id === dragItem);
      if (found) {
        currentStage = stage;
        opp = found;
        break;
      }
    }

    if (!opp || currentStage === newStage) {
      setDragItem(null);
      return;
    }

    // Optimistic update
    setPipeline((prev) => {
      const updated = { ...prev };
      updated[currentStage] = (updated[currentStage] || []).filter(
        (o) => o.id !== dragItem
      );
      updated[newStage] = [
        { ...opp!, stage: newStage as OpportunityStage },
        ...(updated[newStage] || []),
      ];
      return updated;
    });

    setDragItem(null);

    try {
      await moveOpportunityStage(opp.id, newStage as OpportunityStage);
    } catch (err: any) {
      if (err.gateError) {
        setGateToast({
          oppTitle: opp.title,
          missing: err.gateError.missing_requirements,
        });
        setTimeout(() => setGateToast(null), 5000);
      } else {
        console.error("Failed to move opportunity", err);
      }
      fetchPipeline();
    }
  }

  // Calculate totals
  const totalOpps = Object.values(pipeline).reduce(
    (sum, opps) => sum + opps.length,
    0
  );
  const totalValue = Object.values(pipeline).reduce(
    (sum, opps) =>
      sum + opps.reduce((s, o) => s + (Number(o.estimated_value) || 0), 0),
    0
  );
  const weightedValue = Object.values(pipeline).reduce(
    (sum, opps) =>
      sum +
      opps.reduce(
        (s, o) => s + ((Number(o.estimated_value) || 0) * (Number(o.probability) || 0)) / 100,
        0
      ),
    0
  );

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-slate-400">Loading pipeline...</div>
      </div>
    );
  }

  const FILTERS: { id: PipelineFilter; label: string; count?: number; color?: string }[] = [
    { id: "all", label: "All Deals" },
    { id: "stalled", label: "Stalled 14+ Days", count: stalledCount, color: "amber" },
    { id: "no_next_step", label: "No Next Step", count: noNextStepCount, color: "red" },
  ];

  return (
    <div>
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              Opportunity Pipeline
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-400">
              {totalOpps} opportunities &bull; ${totalValue.toLocaleString()}{" "}
              total &bull; ${Math.round(weightedValue).toLocaleString()} weighted
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <HelpPanel
              pageKey="pipeline"
              tagline="Your active deals on a Kanban board. Drag cards between stages. If an opportunity has no next step date, it is dying. Fix it immediately."
              sections={[
                {
                  title: "What it is",
                  content: ["A visual board of every opportunity organized by stage. Each column is a stage in the sales process from Targeted through Reorder Cycle."],
                },
                {
                  title: "What to do here",
                  content: [
                    "Drag cards to the next stage when you complete a milestone",
                    "Click any card to open the full opportunity detail",
                    "Stage gates will block you if required fields or checklist items are missing \u2014 complete them first or force-advance with a reason",
                    "Every card should have a next step date. No next step = dying deal",
                    "Use the value and probability to keep your weighted pipeline accurate",
                  ],
                },
                {
                  title: "Stage definitions",
                  content: [
                    "Targeted \u2192 Contact Found \u2192 First Touch \u2192 Meeting Booked \u2192 Pitch Delivered \u2192 Samples Sent \u2192 Follow Up \u2192 Vendor Setup \u2192 Authorization Pending \u2192 PO Received \u2192 On Shelf \u2192 Reorder Cycle",
                    "If a deal is stuck in the same stage for more than 2 weeks, something is wrong. Diagnose it.",
                  ],
                },
              ]}
            />
            <Link
              href="/accounts"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
            >
              + New from Account
            </Link>
          </div>
        </div>
      </div>

      {/* Pipeline Filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setActiveFilter(f.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              activeFilter === f.id
                ? f.color === "amber"
                  ? "bg-amber-600 text-white"
                  : f.color === "red"
                  ? "bg-red-600 text-white"
                  : "bg-indigo-600 text-white"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            {f.label}
            {f.count !== undefined && f.count > 0 && (
              <span className="ml-1.5 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px]">
                {f.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Stage Gate Toast */}
      {gateToast && (
        <div className="mb-4 rounded-lg border border-amber-700/50 bg-amber-900/20 px-4 py-3 flex items-start gap-3">
          <span className="text-amber-400 text-lg flex-shrink-0">&#9888;</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-300">
              Cannot advance &quot;{gateToast.oppTitle}&quot;
            </p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {gateToast.missing.map((req, i) => (
                <span key={i} className="rounded bg-amber-800/30 px-2 py-0.5 text-[10px] text-amber-200">
                  {req.label}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={() => setGateToast(null)}
            className="text-amber-400 hover:text-amber-300 text-sm flex-shrink-0"
          >
            &#10005;
          </button>
        </div>
      )}

      {/* 12-Stage Kanban — horizontal scroll */}
      <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-2 sm:gap-3" style={{ minWidth: "1800px" }}>
          {OPPORTUNITY_STAGES.map((stage) => {
            const allStageOpps = pipeline[stage.id] || [];
            const stageOpps = allStageOpps.filter(shouldShow);
            const stageValue = stageOpps.reduce(
              (sum, o) => sum + (Number(o.estimated_value) || 0),
              0
            );

            return (
              <div
                key={stage.id}
                className={`flex flex-col rounded-xl border-t-2 ${stage.color} bg-slate-800/50 p-2 sm:p-3 transition-colors w-[160px] sm:w-[200px] flex-shrink-0 ${
                  dragOverStage === stage.id
                    ? "bg-slate-700/50 ring-2 ring-indigo-500/30"
                    : ""
                }`}
                onDragOver={(e) => handleDragOver(e, stage.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, stage.id)}
              >
                {/* Column Header */}
                <div className="mb-2 sm:mb-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] sm:text-xs font-semibold text-white truncate">
                      {stage.label}
                    </h3>
                    <span className="rounded-full bg-slate-700 px-1.5 py-0.5 text-[10px] font-medium text-slate-300">
                      {stageOpps.length}
                      {activeFilter !== "all" && allStageOpps.length !== stageOpps.length && (
                        <span className="text-slate-500">/{allStageOpps.length}</span>
                      )}
                    </span>
                  </div>
                  {stageValue > 0 && (
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      ${stageValue.toLocaleString()}
                    </p>
                  )}
                </div>

                {/* Cards */}
                <div className="flex-1 space-y-2 overflow-y-auto max-h-[55vh] sm:max-h-[60vh]">
                  {stageOpps.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-600 p-3 text-center text-[10px] text-slate-500">
                      {activeFilter !== "all" ? "None matching filter" : "Drop here"}
                    </div>
                  ) : (
                    stageOpps.map((opp) => {
                      const oppIsStalled = isStalled(opp);
                      const oppNoNextStep = isMissingNextStep(opp);

                      return (
                        <div
                          key={opp.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, opp.id)}
                          className={`rounded-lg border bg-slate-800 p-2 sm:p-2.5 cursor-grab active:cursor-grabbing transition-all hover:border-slate-600 ${
                            dragItem === opp.id ? "opacity-50" : ""
                          } ${
                            oppIsStalled
                              ? "border-amber-600/50"
                              : oppNoNextStep
                              ? "border-red-600/50"
                              : "border-slate-700"
                          }`}
                        >
                          <Link
                            href={`/opportunities/${opp.id}`}
                            className="text-[11px] sm:text-xs font-medium text-white hover:text-indigo-400 transition-colors block truncate"
                          >
                            {opp.title}
                          </Link>
                          <p className="mt-0.5 text-[10px] text-slate-400 truncate">
                            {opp.account_name}
                          </p>
                          <div className="mt-1.5 flex items-center justify-between text-[10px]">
                            {opp.estimated_value ? (
                              <span className="text-emerald-400 font-medium">
                                ${Number(opp.estimated_value).toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-slate-500">No value</span>
                            )}
                            {opp.next_step_date ? (
                              <span
                                className={`${
                                  new Date(opp.next_step_date) < new Date()
                                    ? "text-red-400"
                                    : "text-slate-500"
                                }`}
                              >
                                {new Date(
                                  opp.next_step_date
                                ).toLocaleDateString()}
                              </span>
                            ) : (
                              <span className="text-red-400 font-medium">No next step</span>
                            )}
                          </div>
                          {/* Stalled / No Next Step badges */}
                          {(oppIsStalled || oppNoNextStep) && (
                            <div className="mt-1 flex gap-1">
                              {oppIsStalled && (
                                <span className="rounded bg-amber-800/30 px-1.5 py-0.5 text-[9px] text-amber-300">
                                  Stalled
                                </span>
                              )}
                              {oppNoNextStep && (
                                <span className="rounded bg-red-800/30 px-1.5 py-0.5 text-[9px] text-red-300">
                                  No next step
                                </span>
                              )}
                            </div>
                          )}
                          {opp.location_city && opp.location_state && (
                            <p className="mt-1 text-[10px] text-slate-500 truncate">
                              {opp.location_city}, {opp.location_state}
                            </p>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function PipelinePage() {
  return (
    <div className="mx-auto max-w-7xl">
      <Suspense fallback={<div className="flex min-h-[50vh] items-center justify-center"><div className="text-slate-400">Loading pipeline...</div></div>}>
        <PipelineContent />
      </Suspense>
    </div>
  );
}
