"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  getDashboardStats,
  createTask,
  addOpportunityActivity,
  moveOpportunityStage,
  getRetailContacts,
  getOpportunity,
  aiNextStep,
} from "@/lib/api";
import type { Opportunity, RetailContact, AINextStepResult } from "@/lib/api";
import {
  STALLED_WIZARD_STEPS,
  formatGrowthOpsTaskTitle,
  formatGrowthOpsTaskDescription,
  todayISO,
  futureDateISO,
} from "@/lib/growth-ops-engine";

interface StalledDeal {
  id: string;
  title: string;
  account_name: string;
  stage: string;
  days_stalled: number;
  next_step_date?: string;
  estimated_value?: number;
}

interface Props {
  onClose: () => void;
}

export default function StalledDealWizard({ onClose }: Props) {
  const [stalledDeals, setStalledDeals] = useState<StalledDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeal, setSelectedDeal] = useState<StalledDeal | null>(null);
  const [opp, setOpp] = useState<Opportunity | null>(null);
  const [contacts, setContacts] = useState<RetailContact[]>([]);
  const [currentStep, setCurrentStep] = useState(0); // 0 = deal picker
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [notes, setNotes] = useState("");
  const [aiResult, setAiResult] = useState<AINextStepResult | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const stats = await getDashboardStats();
        const stalled = (stats.today_priorities?.stalled_deals ?? [])
          .filter((d: any) => (d.days_stalled ?? 0) >= 14)
          .map((d: any) => ({
            id: d.id,
            title: d.title,
            account_name: d.account_name ?? "",
            stage: d.stage,
            days_stalled: d.days_stalled,
            next_step_date: d.next_step_date,
            estimated_value: d.estimated_value,
          }));
        setStalledDeals(stalled);
      } catch (err) {
        console.error("Failed to load stalled deals", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function selectDeal(deal: StalledDeal) {
    setSelectedDeal(deal);
    setCurrentStep(1);
    try {
      const [oppData, contactData] = await Promise.all([
        getOpportunity(deal.id),
        deal.account_name
          ? getRetailContacts({ search: deal.account_name }).catch(() => [])
          : Promise.resolve([]),
      ]);
      setOpp(oppData);
      setContacts(contactData);
    } catch (err) {
      console.error("Failed to load opportunity details", err);
    }
  }

  async function completeCurrentStep() {
    if (!selectedDeal) return;
    setActionLoading(true);
    const step = STALLED_WIZARD_STEPS[currentStep - 1];

    try {
      // Step-specific actions
      if (step.actionType === "task" && currentStep === 3) {
        // Step 3: Create call task
        await createTask({
          title: formatGrowthOpsTaskTitle("Call and leave voicemail", opp ?? undefined),
          description: formatGrowthOpsTaskDescription(
            `Stalled Deal Fix Step 3: Call buyer and leave voicemail. ${notes}`,
            opp ?? undefined
          ),
          priority: "high",
          due_date: todayISO(),
        });
      } else if (step.actionType === "email" && currentStep === 5) {
        // Step 5: Generate AI email draft
        if (opp) {
          const result = await aiNextStep(opp.id);
          setAiResult(result);
        }
      } else if (step.actionType === "stage_change" && currentStep === 7) {
        // Step 7: Mark cold
        try {
          await moveOpportunityStage(
            selectedDeal.id,
            "closed_lost",
            "Stalled — no response after Growth Ops 7-step fix list"
          );
        } catch {
          // Stage gate may block — that's OK
        }
        // Create revisit task
        await createTask({
          title: formatGrowthOpsTaskTitle("Revisit — was cold for 60 days", opp ?? undefined),
          description: formatGrowthOpsTaskDescription(
            "This deal was marked cold after completing the stalled deal fix list. Check if timing has changed.",
            opp ?? undefined
          ),
          priority: "low",
          due_date: futureDateISO(60),
        });
      }

      // Log activity on opportunity
      if (opp) {
        await addOpportunityActivity(opp.id, {
          type: "note",
          title: `Stalled Deal Fix: Step ${step.number} — ${step.title}`,
          description: notes || step.description,
        });
      }

      setCompletedSteps((prev) => [...prev, currentStep]);
      setNotes("");

      if (currentStep === 7) {
        setFinished(true);
      } else {
        setCurrentStep((prev) => prev + 1);
      }
    } catch (err) {
      console.error("Step action failed", err);
    } finally {
      setActionLoading(false);
    }
  }

  function skipStep() {
    if (currentStep === 7) {
      setFinished(true);
    } else {
      setCurrentStep((prev) => prev + 1);
    }
    setNotes("");
  }

  // ── Render ──────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-800 p-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white text-lg"
        >
          &#10005;
        </button>

        <h2 className="text-lg font-semibold text-white mb-1">Stalled Deal Wizard</h2>
        <p className="text-sm text-slate-400 mb-5">
          Fix deals stuck 14+ days. Work through each step in order.
        </p>

        {/* ── Deal Picker ── */}
        {currentStep === 0 && (
          <div>
            {loading ? (
              <p className="text-sm text-slate-400">Loading stalled deals...</p>
            ) : stalledDeals.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-emerald-400 font-medium">No stalled deals!</p>
                <p className="text-sm text-slate-400 mt-1">All opportunities have been active in the last 14 days.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                  {stalledDeals.length} stalled deal{stalledDeals.length !== 1 ? "s" : ""}
                </p>
                {stalledDeals.map((deal) => (
                  <button
                    key={deal.id}
                    onClick={() => selectDeal(deal)}
                    className="w-full text-left rounded-xl border border-slate-700 bg-slate-900 p-4 hover:border-indigo-500/50 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-white">{deal.title}</p>
                      <span className="rounded-full bg-amber-800/30 px-2 py-0.5 text-[10px] text-amber-300">
                        {deal.days_stalled}d stalled
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{deal.account_name} &bull; {deal.stage}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Wizard Steps ── */}
        {currentStep > 0 && !finished && selectedDeal && (
          <div>
            {/* Progress bar */}
            <div className="flex gap-1 mb-5">
              {STALLED_WIZARD_STEPS.map((s) => (
                <div
                  key={s.number}
                  className={`h-1.5 flex-1 rounded-full ${
                    completedSteps.includes(s.number)
                      ? "bg-emerald-500"
                      : s.number === currentStep
                      ? "bg-indigo-500"
                      : "bg-slate-700"
                  }`}
                />
              ))}
            </div>

            <div className="mb-4">
              <p className="text-xs text-slate-500">
                Step {currentStep} of 7 &bull; {selectedDeal.title}
              </p>
              <h3 className="text-base font-semibold text-white mt-1">
                {STALLED_WIZARD_STEPS[currentStep - 1].title}
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                {STALLED_WIZARD_STEPS[currentStep - 1].description}
              </p>
            </div>

            {/* Step 1: Show contacts */}
            {currentStep === 1 && contacts.length > 0 && (
              <div className="mb-4 rounded-lg border border-slate-700 bg-slate-900 p-3">
                <p className="text-xs text-slate-500 mb-2">Contacts found:</p>
                {contacts.slice(0, 5).map((c) => (
                  <div key={c.id} className="flex items-center gap-2 py-1">
                    <span className={`h-2 w-2 rounded-full ${c.is_decision_maker ? "bg-emerald-500" : "bg-slate-600"}`} />
                    <span className="text-sm text-white">
                      {c.first_name} {c.last_name}
                    </span>
                    <span className="text-xs text-slate-500">{c.role}</span>
                    {c.is_decision_maker && (
                      <span className="text-[10px] text-emerald-400">Decision Maker</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Step 2: Show recent activities */}
            {currentStep === 2 && opp?.activities && opp.activities.length > 0 && (
              <div className="mb-4 rounded-lg border border-slate-700 bg-slate-900 p-3">
                <p className="text-xs text-slate-500 mb-2">Recent activities:</p>
                {opp.activities.slice(0, 3).map((a) => (
                  <div key={a.id} className="py-1.5 border-b border-slate-800 last:border-0">
                    <p className="text-sm text-white">{a.title}</p>
                    <p className="text-xs text-slate-500">
                      {a.type} &bull; {new Date(a.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Step 5: AI email draft */}
            {currentStep === 5 && aiResult?.email_draft && (
              <div className="mb-4 rounded-lg border border-indigo-500/30 bg-indigo-900/10 p-3">
                <p className="text-xs text-indigo-300 mb-1">AI-generated email draft:</p>
                <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans">
                  {aiResult.email_draft}
                </pre>
              </div>
            )}

            {/* Step 7: Warning */}
            {currentStep === 7 && (
              <div className="mb-4 rounded-lg border border-red-700/30 bg-red-900/10 p-3">
                <p className="text-sm text-red-400">
                  This will mark the deal as <strong>Closed Lost</strong> and create a &ldquo;Revisit in 60 days&rdquo; task.
                </p>
              </div>
            )}

            {/* Notes input */}
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes for this step..."
              rows={2}
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none mb-4"
            />

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={completeCurrentStep}
                disabled={actionLoading}
                className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                {actionLoading
                  ? "Working..."
                  : currentStep === 7
                  ? "Mark Cold & Close"
                  : "Complete Step"}
              </button>
              {currentStep < 7 && (
                <button
                  onClick={skipStep}
                  className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700"
                >
                  Skip
                </button>
              )}
              <button
                onClick={() => { setCurrentStep(0); setSelectedDeal(null); setOpp(null); setCompletedSteps([]); setFinished(false); }}
                className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-400 hover:bg-slate-700"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* ── Finished ── */}
        {finished && selectedDeal && (
          <div className="text-center py-6">
            <p className="text-2xl mb-2">{completedSteps.length === 7 ? "\u2705" : "\u{1F4CB}"}</p>
            <h3 className="text-base font-semibold text-white">
              {completedSteps.length === 7
                ? "All steps completed"
                : `${completedSteps.length} of 7 steps completed`}
            </h3>
            <p className="text-sm text-slate-400 mt-1 mb-4">
              {completedSteps.includes(7)
                ? "Deal marked as cold. Revisit task created for 60 days."
                : "Actions logged on the opportunity."}
            </p>
            <div className="flex gap-2 justify-center">
              <Link
                href={`/opportunities/${selectedDeal.id}`}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
              >
                View Opportunity
              </Link>
              <button
                onClick={onClose}
                className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
