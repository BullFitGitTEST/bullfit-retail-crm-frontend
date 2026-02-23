"use client";

import { useEffect, useState, useCallback } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { getPipeline, moveProspectInPipeline, createProspect } from "@/lib/api";
import type { PipelineView, Prospect } from "@/lib/api";
import KanbanColumn from "@/components/pipeline/KanbanColumn";
import ProspectCard from "@/components/pipeline/ProspectCard";

const STAGES = [
  { id: "lead", label: "Leads", color: "border-blue-500" },
  { id: "contacted", label: "Contacted", color: "border-yellow-500" },
  { id: "interested", label: "Interested", color: "border-purple-500" },
  { id: "partner", label: "Partners", color: "border-green-500" },
];

export default function PipelinePage() {
  const [pipeline, setPipeline] = useState<PipelineView>({
    lead: [],
    contacted: [],
    interested: [],
    partner: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeProspect, setActiveProspect] = useState<Prospect | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProspectName, setNewProspectName] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const fetchPipeline = useCallback(async () => {
    try {
      const data = await getPipeline();
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

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const allProspects = [
      ...pipeline.lead,
      ...pipeline.contacted,
      ...pipeline.interested,
      ...pipeline.partner,
    ];
    const prospect = allProspects.find((p) => p.id === active.id);
    setActiveProspect(prospect || null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveProspect(null);

    if (!over) return;

    const prospectId = active.id as string;
    const newStage = over.id as string;

    if (!["lead", "contacted", "interested", "partner"].includes(newStage)) return;

    // Find the prospect and its current stage
    let currentStage = "";
    for (const [stage, prospects] of Object.entries(pipeline)) {
      if (prospects.find((p: Prospect) => p.id === prospectId)) {
        currentStage = stage;
        break;
      }
    }

    if (currentStage === newStage) return;

    // Optimistic update
    const prospect = pipeline[currentStage as keyof PipelineView].find(
      (p) => p.id === prospectId
    );
    if (!prospect) return;

    setPipeline((prev) => ({
      ...prev,
      [currentStage]: prev[currentStage as keyof PipelineView].filter(
        (p) => p.id !== prospectId
      ),
      [newStage]: [
        { ...prospect, pipeline_stage: newStage as Prospect["pipeline_stage"] },
        ...prev[newStage as keyof PipelineView],
      ],
    }));

    try {
      await moveProspectInPipeline(prospectId, newStage);
    } catch (err) {
      console.error("Failed to move prospect", err);
      fetchPipeline(); // Revert on error
    }
  }

  async function handleAddProspect(e: React.FormEvent) {
    e.preventDefault();
    if (!newProspectName.trim()) return;

    try {
      const newProspect = await createProspect({
        business_name: newProspectName.trim(),
        pipeline_stage: "lead",
      });
      setPipeline((prev) => ({
        ...prev,
        lead: [newProspect, ...prev.lead],
      }));
      setNewProspectName("");
      setShowAddForm(false);
    } catch (err) {
      console.error("Failed to create prospect", err);
    }
  }

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
          <h1 className="text-2xl font-bold text-white">Pipeline</h1>
          <p className="mt-1 text-sm text-slate-400">
            Drag prospects between stages to update their status
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
        >
          + Add Prospect
        </button>
      </div>

      {/* Quick add form */}
      {showAddForm && (
        <form onSubmit={handleAddProspect} className="mb-6 flex items-center gap-3">
          <input
            type="text"
            value={newProspectName}
            onChange={(e) => setNewProspectName(e.target.value)}
            placeholder="Business name..."
            className="flex-1 rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
            autoFocus
          />
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => { setShowAddForm(false); setNewProspectName(""); }}
            className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
          >
            Cancel
          </button>
        </form>
      )}

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-4 gap-4 min-h-[60vh]">
          {STAGES.map((stage) => (
            <KanbanColumn
              key={stage.id}
              id={stage.id}
              label={stage.label}
              color={stage.color}
              prospects={pipeline[stage.id as keyof PipelineView]}
            />
          ))}
        </div>

        <DragOverlay>
          {activeProspect ? (
            <ProspectCard prospect={activeProspect} isDragging />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
