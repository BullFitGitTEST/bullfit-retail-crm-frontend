"use client";

import { useState } from "react";
import {
  createTask,
  updateOpportunity,
  aiNextStep,
} from "@/lib/api";
import type { Opportunity, AINextStepResult } from "@/lib/api";
import {
  getPlaybookForStage,
  getStageEnforcementWarnings,
  formatGrowthOpsTaskTitle,
  formatGrowthOpsTaskDescription,
  todayISO,
  futureDateISO,
} from "@/lib/growth-ops-engine";
import { STAGE_GUIDES } from "@/lib/growth-ops-data";
import HelpPanel from "@/components/HelpPanel";

interface Props {
  opp: Opportunity;
  onRefresh: () => void;
}

export default function StagePlaybookPanel({ opp, onRefresh }: Props) {
  const playbook = getPlaybookForStage(opp.stage);
  const guide = STAGE_GUIDES.find((g) => {
    if (g.id === "lead" && ["targeted", "contact_found", "first_touch"].includes(opp.stage)) return true;
    if (g.id === "contacted" && opp.stage === "meeting_booked") return true;
    if (g.id === "interested" && ["pitch_delivered", "follow_up"].includes(opp.stage)) return true;
    if (g.id === "partner" && ["samples_sent", "vendor_setup", "authorization_pending"].includes(opp.stage)) return true;
    return false;
  });

  const warnings = getStageEnforcementWarnings(opp);

  // State
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AINextStepResult | null>(null);
  const [nextStepDate, setNextStepDate] = useState(opp.next_step_date || "");
  const [nextStepDesc, setNextStepDesc] = useState(opp.next_step_description || "");
  const [savingNextStep, setSavingNextStep] = useState(false);
  const [nextStepSaved, setNextStepSaved] = useState(false);

  // Apply playbook — create tasks
  async function applyPlaybook() {
    if (!playbook) return;
    setApplying(true);
    try {
      await Promise.all(
        playbook.tasks.map((t) =>
          createTask({
            title: formatGrowthOpsTaskTitle(t.title, opp),
            description: formatGrowthOpsTaskDescription(t.title, opp),
            priority: t.priority,
            due_date: t.dueDaysOffset === 0 ? todayISO() : futureDateISO(t.dueDaysOffset),
          })
        )
      );
      setApplied(true);
    } catch (err) {
      console.error("Failed to apply playbook", err);
    } finally {
      setApplying(false);
    }
  }

  // Generate AI email draft
  async function generateEmailDraft() {
    setAiLoading(true);
    try {
      const result = await aiNextStep(opp.id);
      setAiResult(result);
    } catch (err) {
      console.error("Failed to generate email draft", err);
    } finally {
      setAiLoading(false);
    }
  }

  // Save next step
  async function saveNextStep() {
    if (!nextStepDate) return;
    setSavingNextStep(true);
    try {
      await updateOpportunity(opp.id, {
        next_step_date: nextStepDate,
        next_step_description: nextStepDesc,
      });
      setNextStepSaved(true);
      onRefresh();
      setTimeout(() => setNextStepSaved(false), 2000);
    } catch (err) {
      console.error("Failed to save next step", err);
    } finally {
      setSavingNextStep(false);
    }
  }

  // No playbook for this stage (e.g., po_received, on_shelf, reorder_cycle)
  if (!playbook && !guide) {
    return (
      <div className="py-8 text-center">
        <p className="text-slate-400 text-sm">
          No playbook guidance for the <strong className="text-white">{opp.stage.replace(/_/g, " ")}</strong> stage.
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Playbook covers Lead, Contacted, Interested, and Partner stages.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Help */}
      <div className="flex justify-end">
        <HelpPanel
          pageKey="opp-playbook"
          tagline="Stage-specific guidance for this deal. Apply the playbook, generate emails, and set your next step — all from here."
          sections={[
            {
              title: "What this tab does",
              content: [
                "Shows the Growth Ops playbook for this deal\u2019s current stage with specific actions to take",
                "The \u201cDo This\u201d checklist shows exactly what tasks to complete before moving to the next stage",
                "Click \u201cApply Playbook\u201d to create all the tasks in your task list automatically",
              ],
            },
            {
              title: "AI Email Draft",
              content: [
                "Click \u201cGenerate Email Draft with AI\u201d to get a context-aware email based on this opportunity\u2019s stage, account, and activity history",
                "Copy the draft to your clipboard and paste it into your email client",
                "If the AI says it needs more info, fill in the missing fields on the Edit tab first",
              ],
            },
            {
              title: "Set Next Step",
              content: [
                "Every deal must have a next step with a date \u2014 deals without one show a warning",
                "Use the date picker and description field to set when and what your next action is",
                "The next step updates on the opportunity detail and shows up on your dashboard",
              ],
            },
            {
              title: "Enforcement Warnings",
              content: [
                "Amber warnings at the top tell you what\u2019s missing before you can advance this deal",
                "Common warnings: no contact assigned, no next step date, no estimated value set",
                "Fix these before trying to move the deal to the next pipeline stage",
              ],
            },
          ]}
        />
      </div>

      {/* Enforcement Warnings */}
      {warnings.length > 0 && (
        <div className="rounded-lg border border-amber-700/30 bg-amber-900/10 p-4">
          <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
            Action Required
          </p>
          <ul className="space-y-1">
            {warnings.map((w, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-0.5 text-amber-400 text-xs">&#9888;</span>
                <span className="text-sm text-amber-200">{w}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Stage Goal */}
      {playbook && (
        <div className="rounded-xl border border-indigo-500/30 bg-indigo-900/10 p-4">
          <p className="text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-1">
            {playbook.growthOpsStage} Stage Goal
          </p>
          <p className="text-base font-medium text-white">{playbook.goal}</p>
        </div>
      )}

      {/* Do This checklist */}
      {playbook && (
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
          <p className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
            Do This
          </p>
          <ul className="space-y-2">
            {playbook.tasks.map((t, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600/20 text-[10px] font-bold text-indigo-300">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <span className="text-sm text-slate-300">{t.title}</span>
                  {t.dueDaysOffset > 0 && (
                    <span className="ml-2 text-[10px] text-slate-500">
                      +{t.dueDaysOffset}d
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {/* Apply Playbook button */}
          <div className="mt-4">
            {applied ? (
              <div className="rounded-lg border border-emerald-700/30 bg-emerald-900/10 px-4 py-2.5">
                <p className="text-sm text-emerald-400 font-medium">
                  &#10003; {playbook.tasks.length} tasks created
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Check your Tasks page to see them.
                </p>
              </div>
            ) : (
              <button
                onClick={applyPlaybook}
                disabled={applying}
                className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                {applying ? "Creating tasks..." : `Apply ${playbook.growthOpsStage} Playbook \u2014 Create ${playbook.tasks.length} Tasks`}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Insight */}
      {guide && (
        <div
          className={`rounded-lg border p-3 ${
            guide.insightType === "wins"
              ? "border-emerald-700/30 bg-emerald-900/10"
              : "border-amber-700/30 bg-amber-900/10"
          }`}
        >
          <p
            className={`text-xs font-semibold ${
              guide.insightType === "wins" ? "text-emerald-400" : "text-amber-400"
            }`}
          >
            {guide.insightLabel}
          </p>
          <p className="text-sm text-slate-300 mt-1">{guide.insight}</p>
        </div>
      )}

      {/* Generate Email Draft */}
      <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
        <p className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
          Generate Email Draft
        </p>
        {aiResult?.email_draft ? (
          <div>
            {aiResult.recommended_action && (
              <p className="text-xs text-indigo-300 mb-2">{aiResult.recommended_action}</p>
            )}
            <pre className="rounded-lg border border-slate-700 bg-slate-800 p-3 text-sm text-slate-300 whitespace-pre-wrap font-sans max-h-64 overflow-y-auto">
              {aiResult.email_draft}
            </pre>
            <button
              onClick={() => {
                if (aiResult.email_draft) navigator.clipboard.writeText(aiResult.email_draft);
              }}
              className="mt-2 rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700"
            >
              Copy to clipboard
            </button>
          </div>
        ) : aiResult?.status === "needs_info" ? (
          <div className="rounded-lg border border-amber-700/30 bg-amber-900/10 p-3">
            <p className="text-sm text-amber-300">
              AI needs more info: {aiResult.missing_fields?.join(", ") ?? aiResult.reason}
            </p>
          </div>
        ) : (
          <button
            onClick={generateEmailDraft}
            disabled={aiLoading}
            className="w-full rounded-lg border border-indigo-500/30 bg-indigo-900/10 px-4 py-2.5 text-sm font-medium text-indigo-300 hover:bg-indigo-900/20 disabled:opacity-50"
          >
            {aiLoading ? "Generating..." : "Generate Email Draft with AI"}
          </button>
        )}
      </div>

      {/* Set Next Step */}
      <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
        <p className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
          Set Next Step
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Date</label>
            <input
              type="date"
              value={nextStepDate}
              onChange={(e) => setNextStepDate(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Description</label>
            <input
              type="text"
              value={nextStepDesc}
              onChange={(e) => setNextStepDesc(e.target.value)}
              placeholder="Next step..."
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>
        <button
          onClick={saveNextStep}
          disabled={savingNextStep || !nextStepDate}
          className="mt-3 w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {nextStepSaved ? "\u2713 Saved" : savingNextStep ? "Saving..." : "Save Next Step"}
        </button>
      </div>
    </div>
  );
}
