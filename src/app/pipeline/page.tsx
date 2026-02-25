"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  getOpportunityPipeline,
  moveOpportunityStage,
  OPPORTUNITY_STAGES,
} from "@/lib/api";
import type { Opportunity, OpportunityPipelineView, OpportunityStage } from "@/lib/api";

export default function PipelinePage() {
  const [pipeline, setPipeline] = useState<OpportunityPipelineView>({});
  const [loading, setLoading] = useState(true);
  const [dragItem, setDragItem] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

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

    // Find which stage the item is currently in
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
    } catch (err) {
      console.error("Failed to move opportunity", err);
      fetchPipeline(); // revert
    }
  }

  // Calculate totals
  const totalOpps = Object.values(pipeline).reduce(
    (sum, opps) => sum + opps.length,
    0
  );
  const totalValue = Object.values(pipeline).reduce(
    (sum, opps) =>
      sum + opps.reduce((s, o) => s + (o.estimated_value || 0), 0),
    0
  );
  const weightedValue = Object.values(pipeline).reduce(
    (sum, opps) =>
      sum +
      opps.reduce(
        (s, o) => s + ((o.estimated_value || 0) * (o.probability || 0)) / 100,
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

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Opportunity Pipeline
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {totalOpps} opportunities &bull; ${totalValue.toLocaleString()}{" "}
            total &bull; ${Math.round(weightedValue).toLocaleString()} weighted
          </p>
        </div>
        <Link
          href="/accounts"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          + New from Account
        </Link>
      </div>

      {/* 12-Stage Kanban — horizontal scroll */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-3" style={{ minWidth: "2400px" }}>
          {OPPORTUNITY_STAGES.map((stage) => {
            const stageOpps = pipeline[stage.id] || [];
            const stageValue = stageOpps.reduce(
              (sum, o) => sum + (o.estimated_value || 0),
              0
            );

            return (
              <div
                key={stage.id}
                className={`flex flex-col rounded-xl border-t-2 ${stage.color} bg-slate-800/50 p-3 transition-colors w-[200px] flex-shrink-0 ${
                  dragOverStage === stage.id
                    ? "bg-slate-700/50 ring-2 ring-indigo-500/30"
                    : ""
                }`}
                onDragOver={(e) => handleDragOver(e, stage.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, stage.id)}
              >
                {/* Column Header */}
                <div className="mb-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-white truncate">
                      {stage.label}
                    </h3>
                    <span className="rounded-full bg-slate-700 px-1.5 py-0.5 text-[10px] font-medium text-slate-300">
                      {stageOpps.length}
                    </span>
                  </div>
                  {stageValue > 0 && (
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      ${stageValue.toLocaleString()}
                    </p>
                  )}
                </div>

                {/* Cards */}
                <div className="flex-1 space-y-2 overflow-y-auto max-h-[60vh]">
                  {stageOpps.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-600 p-3 text-center text-[10px] text-slate-500">
                      Drop here
                    </div>
                  ) : (
                    stageOpps.map((opp) => (
                      <div
                        key={opp.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, opp.id)}
                        className={`rounded-lg border border-slate-700 bg-slate-800 p-2.5 cursor-grab transition-all hover:border-slate-600 ${
                          dragItem === opp.id ? "opacity-50" : ""
                        }`}
                      >
                        <Link
                          href={`/opportunities/${opp.id}`}
                          className="text-xs font-medium text-white hover:text-indigo-400 transition-colors block truncate"
                        >
                          {opp.title}
                        </Link>
                        <p className="mt-0.5 text-[10px] text-slate-400 truncate">
                          {opp.account_name}
                        </p>
                        <div className="mt-1.5 flex items-center justify-between text-[10px]">
                          {opp.estimated_value ? (
                            <span className="text-emerald-400 font-medium">
                              ${opp.estimated_value.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-slate-500">No value</span>
                          )}
                          {opp.next_step_date && (
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
                          )}
                        </div>
                        {opp.location_city && opp.location_state && (
                          <p className="mt-1 text-[10px] text-slate-500 truncate">
                            {opp.location_city}, {opp.location_state}
                          </p>
                        )}
                      </div>
                    ))
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
