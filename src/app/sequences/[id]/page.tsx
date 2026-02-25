"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  getSequence,
  getTemplates,
  addSequenceStep,
  deleteSequenceStep,
  advanceEnrollment,
  stopEnrollment,
  OPPORTUNITY_STAGES,
} from "@/lib/api";
import type { Sequence, Template, SequenceStep } from "@/lib/api";

const stageLabelMap: Record<string, string> = {};
for (const s of OPPORTUNITY_STAGES) {
  stageLabelMap[s.id] = s.label;
}

export default function SequenceDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [sequence, setSequence] = useState<Sequence | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  // Add step form
  const [showAddStep, setShowAddStep] = useState(false);
  const [stepForm, setStepForm] = useState({
    template_id: "",
    channel: "email",
    delay_days: "0",
    notes: "",
    body_override: "",
    subject_override: "",
  });
  const [savingStep, setSavingStep] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [seqData, tmplData] = await Promise.all([
        getSequence(id),
        getTemplates(),
      ]);
      setSequence(seqData);
      setTemplates(tmplData);
    } catch (err) {
      console.error("Failed to fetch sequence", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleAddStep(e: React.FormEvent) {
    e.preventDefault();
    setSavingStep(true);
    try {
      await addSequenceStep(id, {
        template_id: stepForm.template_id || undefined,
        channel: stepForm.channel,
        delay_days: Number(stepForm.delay_days) || 0,
        notes: stepForm.notes || undefined,
        body_override: stepForm.body_override || undefined,
        subject_override: stepForm.subject_override || undefined,
      });
      setShowAddStep(false);
      setStepForm({ template_id: "", channel: "email", delay_days: "0", notes: "", body_override: "", subject_override: "" });
      fetchData();
    } catch (err) {
      console.error("Failed to add step", err);
    } finally {
      setSavingStep(false);
    }
  }

  async function handleDeleteStep(stepId: string) {
    if (!confirm("Remove this step?")) return;
    try {
      await deleteSequenceStep(id, stepId);
      fetchData();
    } catch (err) {
      console.error("Failed to delete step", err);
    }
  }

  async function handleAdvance(enrollmentId: string) {
    try {
      await advanceEnrollment(id, enrollmentId);
      fetchData();
    } catch (err) {
      console.error("Failed to advance enrollment", err);
    }
  }

  async function handleStop(enrollmentId: string) {
    try {
      await stopEnrollment(id, enrollmentId);
      fetchData();
    } catch (err) {
      console.error("Failed to stop enrollment", err);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-slate-400">Loading sequence...</div>
      </div>
    );
  }

  if (!sequence) {
    return (
      <div className="text-center py-12 text-red-400">Sequence not found</div>
    );
  }

  const channelLabels: Record<string, string> = {
    email: "\u2709 Email",
    call_script: "\u260E Call",
    linkedin: "\uD83D\uDD17 LinkedIn",
    sms: "\uD83D\uDCF1 SMS",
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link href="/sequences" className="text-xs text-indigo-400 hover:text-indigo-300 mb-2 inline-block">
          &larr; Back to Sequences
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">{sequence.name}</h1>
          {sequence.target_stage && (
            <span className="rounded-full bg-indigo-600/20 px-2.5 py-0.5 text-xs text-indigo-300">
              {stageLabelMap[sequence.target_stage] || sequence.target_stage}
            </span>
          )}
          {!sequence.is_active && (
            <span className="rounded bg-slate-600/20 px-2 py-0.5 text-xs text-slate-400">INACTIVE</span>
          )}
        </div>
        {sequence.description && (
          <p className="mt-1 text-sm text-slate-400">{sequence.description}</p>
        )}
      </div>

      {/* Steps Timeline */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white">Steps ({(sequence.steps || []).length})</h2>
          <button
            onClick={() => setShowAddStep(!showAddStep)}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
          >
            + Add Step
          </button>
        </div>

        {showAddStep && (
          <form onSubmit={handleAddStep} className="mb-4 rounded-xl border border-slate-700 bg-slate-800 p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Channel</label>
                <select
                  value={stepForm.channel}
                  onChange={(e) => setStepForm({ ...stepForm, channel: e.target.value })}
                  className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="email">Email</option>
                  <option value="call_script">Call Script</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="sms">SMS</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Delay (days after previous)</label>
                <input
                  type="number"
                  min="0"
                  value={stepForm.delay_days}
                  onChange={(e) => setStepForm({ ...stepForm, delay_days: e.target.value })}
                  className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Template (optional)</label>
                <select
                  value={stepForm.template_id}
                  onChange={(e) => setStepForm({ ...stepForm, template_id: e.target.value })}
                  className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">No template</option>
                  {templates
                    .filter((t) => t.is_active && (!stepForm.channel || t.category === stepForm.channel))
                    .map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                </select>
              </div>
            </div>
            {!stepForm.template_id && (
              <>
                {stepForm.channel === "email" && (
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Subject</label>
                    <input
                      value={stepForm.subject_override}
                      onChange={(e) => setStepForm({ ...stepForm, subject_override: e.target.value })}
                      className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Message Body</label>
                  <textarea
                    rows={3}
                    value={stepForm.body_override}
                    onChange={(e) => setStepForm({ ...stepForm, body_override: e.target.value })}
                    className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </>
            )}
            <div>
              <label className="block text-xs text-slate-400 mb-1">Notes</label>
              <input
                value={stepForm.notes}
                onChange={(e) => setStepForm({ ...stepForm, notes: e.target.value })}
                placeholder="Internal notes about this step"
                className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowAddStep(false)} className="rounded border border-slate-600 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-700">
                Cancel
              </button>
              <button type="submit" disabled={savingStep} className="rounded bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50">
                {savingStep ? "Adding..." : "Add Step"}
              </button>
            </div>
          </form>
        )}

        {(sequence.steps || []).length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            No steps yet. Add your first step above.
          </div>
        ) : (
          <div className="space-y-3">
            {(sequence.steps || []).map((step, i) => (
              <div key={step.id} className="flex items-start gap-3">
                {/* Step number */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600/20 text-sm font-bold text-indigo-300">
                    {i + 1}
                  </div>
                  {i < (sequence.steps || []).length - 1 && (
                    <div className="w-px h-8 bg-slate-700 mt-1" />
                  )}
                </div>

                {/* Step card */}
                <div className="flex-1 rounded-lg border border-slate-700 bg-slate-800 p-3 group">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-300">
                          {channelLabels[step.channel] || step.channel}
                        </span>
                        {step.delay_days > 0 && (
                          <span className="rounded bg-slate-700 px-1.5 py-0.5 text-[10px] text-slate-400">
                            +{step.delay_days}d delay
                          </span>
                        )}
                        {step.template_name && (
                          <span className="rounded bg-purple-600/20 px-1.5 py-0.5 text-[10px] text-purple-300">
                            {step.template_name}
                          </span>
                        )}
                      </div>
                      {step.subject_override && (
                        <p className="text-xs text-slate-400 mt-1">Subject: {step.subject_override}</p>
                      )}
                      {step.body_override && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{step.body_override}</p>
                      )}
                      {step.notes && (
                        <p className="text-[10px] text-slate-600 mt-1 italic">{step.notes}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteStep(step.id)}
                      className="text-xs text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      &#10005;
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Enrollments */}
      <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
        <h2 className="text-sm font-semibold text-white mb-4">
          Enrollments ({(sequence.enrollments || []).length})
        </h2>
        {(sequence.enrollments || []).length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">
            No opportunities enrolled yet. Enroll from an opportunity detail page.
          </p>
        ) : (
          <div className="space-y-2">
            {(sequence.enrollments || []).map((e) => {
              const statusColors: Record<string, string> = {
                active: "bg-emerald-600/20 text-emerald-300",
                completed: "bg-blue-600/20 text-blue-300",
                stopped: "bg-slate-600/20 text-slate-400",
              };
              return (
                <div key={e.id} className="flex items-center justify-between rounded-lg border border-slate-700/50 bg-slate-800/50 p-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Link href={`/opportunities/${e.opportunity_id}`} className="text-sm text-indigo-400 hover:text-indigo-300">
                        {e.opportunity_title || "Unknown"}
                      </Link>
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${statusColors[e.status] || statusColors.active}`}>
                        {e.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {e.account_name} &bull; Step {e.current_step} of {(sequence.steps || []).length}
                      {e.next_step_due && ` \u2022 Due ${new Date(e.next_step_due).toLocaleDateString()}`}
                    </p>
                  </div>
                  {e.status === "active" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAdvance(e.id)}
                        className="rounded bg-emerald-600 px-2 py-1 text-[10px] font-medium text-white hover:bg-emerald-500"
                      >
                        Complete Step
                      </button>
                      <button
                        onClick={() => handleStop(e.id)}
                        className="rounded border border-slate-600 px-2 py-1 text-[10px] text-slate-300 hover:bg-slate-700"
                      >
                        Stop
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
