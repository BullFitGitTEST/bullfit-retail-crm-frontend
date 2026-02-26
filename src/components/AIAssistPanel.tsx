"use client";

import { useState } from "react";
import {
  aiPostMeetingRecap,
  aiSampleFollowup,
  aiNextStep,
  aiCallSummary,
} from "@/lib/api";
import type {
  AIRecapResult,
  AISampleFollowupResult,
  AINextStepResult,
  AICallSummaryResult,
  Opportunity,
} from "@/lib/api";

interface Props {
  opp: Opportunity;
}

type AIFeature = "recap" | "followup" | "nextstep" | "callsummary" | null;

export default function AIAssistPanel({ opp }: Props) {
  const [activeFeature, setActiveFeature] = useState<AIFeature>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inputs
  const [meetingNotes, setMeetingNotes] = useState("");
  const [callNotes, setCallNotes] = useState("");
  const [daysSinceSamples, setDaysSinceSamples] = useState(7);

  // Results
  const [recapResult, setRecapResult] = useState<AIRecapResult | null>(null);
  const [followupResult, setFollowupResult] = useState<AISampleFollowupResult | null>(null);
  const [nextStepResult, setNextStepResult] = useState<AINextStepResult | null>(null);
  const [callResult, setCallResult] = useState<AICallSummaryResult | null>(null);

  function reset() {
    setActiveFeature(null);
    setError(null);
    setRecapResult(null);
    setFollowupResult(null);
    setNextStepResult(null);
    setCallResult(null);
  }

  async function handleGenerateRecap() {
    if (!meetingNotes.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await aiPostMeetingRecap(opp.id, meetingNotes);
      setRecapResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateFollowup() {
    setLoading(true);
    setError(null);
    try {
      const result = await aiSampleFollowup(opp.id, undefined, daysSinceSamples);
      setFollowupResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleNextStep() {
    setLoading(true);
    setError(null);
    try {
      const result = await aiNextStep(opp.id);
      setNextStepResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleCallSummary() {
    if (!callNotes.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await aiCallSummary(callNotes, opp.id);
      setCallResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  const features = [
    {
      id: "nextstep" as const,
      label: "Next Step",
      description: "AI recommends the highest-leverage action to advance this deal",
      icon: "\u{1F3AF}",
      color: "indigo",
    },
    {
      id: "recap" as const,
      label: "Meeting Recap",
      description: "Generate a follow-up email from your meeting notes",
      icon: "\u{1F4DD}",
      color: "emerald",
    },
    {
      id: "followup" as const,
      label: "Sample Follow-Up",
      description: "Create a sample follow-up email for the buyer",
      icon: "\u{1F4E6}",
      color: "amber",
    },
    {
      id: "callsummary" as const,
      label: "Call Summary",
      description: "Extract tasks and next steps from call notes",
      icon: "\u{1F4DE}",
      color: "sky",
    },
  ];

  // ── Feature selection view ──────────────────────────────
  if (!activeFeature) {
    return (
      <div>
        <div className="mb-4">
          <p className="text-sm text-slate-400">
            AI tools to advance this deal. Every output includes a clear next step and date.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {features.map((f) => (
            <button
              key={f.id}
              onClick={() => { reset(); setActiveFeature(f.id); }}
              className="flex items-start gap-3 rounded-xl border border-slate-700 bg-slate-800/50 p-4 text-left hover:border-indigo-500/50 hover:bg-slate-800 transition-all group"
            >
              <span className="text-2xl">{f.icon}</span>
              <div>
                <p className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">
                  {f.label}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">{f.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Shared status bar ───────────────────────────────────
  const StatusBar = ({ result }: { result: { status: string; reason?: string; missing_fields?: string[] } | null }) => {
    if (!result) return null;
    if (result.status === "needs_info") {
      return (
        <div className="mb-4 rounded-lg border border-amber-700/50 bg-amber-900/20 p-3">
          <p className="text-sm font-medium text-amber-300">Missing Information</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {result.missing_fields?.map((f: string) => (
              <span key={f} className="rounded bg-amber-800/40 px-2 py-0.5 text-xs text-amber-300">{f}</span>
            ))}
          </div>
          <p className="text-xs text-amber-400 mt-2">Add the missing data to the opportunity, then try again.</p>
        </div>
      );
    }
    if (result.status === "blocked") {
      return (
        <div className="mb-4 rounded-lg border border-red-700/50 bg-red-900/20 p-3">
          <p className="text-sm font-medium text-red-300">Compliance Blocked</p>
          <p className="text-xs text-red-400 mt-1">{result.reason}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      {/* Back button + title */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={reset}
          className="rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-1.5 text-xs text-slate-400 hover:text-white transition"
        >
          &larr; All AI Tools
        </button>
        <h3 className="text-sm font-semibold text-white">
          {features.find(f => f.id === activeFeature)?.icon}{" "}
          {features.find(f => f.id === activeFeature)?.label}
        </h3>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-700/50 bg-red-900/20 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* ── NEXT STEP ─────────────────────────────── */}
      {activeFeature === "nextstep" && (
        <div>
          {!nextStepResult && (
            <div>
              <p className="text-sm text-slate-400 mb-3">
                AI will analyze this opportunity&apos;s stage, products, activities, and blockers to recommend the best next action.
              </p>
              <button
                onClick={handleNextStep}
                disabled={loading}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                {loading ? "Analyzing..." : "Get Recommendation"}
              </button>
            </div>
          )}
          {nextStepResult && (
            <div>
              <StatusBar result={nextStepResult} />
              {nextStepResult.status === "ok" && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-indigo-500/30 bg-indigo-900/10 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`rounded px-2 py-0.5 text-xs font-medium ${
                        nextStepResult.urgency === "high" ? "bg-red-600/20 text-red-300" :
                        nextStepResult.urgency === "medium" ? "bg-amber-600/20 text-amber-300" :
                        "bg-green-600/20 text-green-300"
                      }`}>
                        {nextStepResult.urgency?.toUpperCase()}
                      </span>
                      <p className="text-sm font-semibold text-white">{nextStepResult.recommended_action}</p>
                    </div>
                    <p className="text-sm text-slate-400">{nextStepResult.why}</p>
                  </div>

                  {nextStepResult.task && (
                    <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-3">
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Create Task</p>
                      <p className="text-sm text-white">{nextStepResult.task.title}</p>
                      <p className="text-xs text-slate-400 mt-1">Due: {nextStepResult.task.due_date}</p>
                    </div>
                  )}

                  {nextStepResult.blockers && nextStepResult.blockers.length > 0 && (
                    <div className="rounded-lg border border-amber-700/30 bg-amber-900/10 p-3">
                      <p className="text-xs text-amber-400 uppercase tracking-wider mb-1">Blockers</p>
                      <ul className="space-y-1">
                        {nextStepResult.blockers.map((b, i) => (
                          <li key={i} className="text-sm text-amber-300 flex items-start gap-1.5">
                            <span className="text-amber-500 mt-0.5">&#8250;</span> {b}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {nextStepResult.email_draft && (
                    <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-3">
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Email Draft</p>
                      <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans">{nextStepResult.email_draft}</pre>
                    </div>
                  )}

                  {nextStepResult.stage_advice && (
                    <p className="text-xs text-slate-500 italic">{nextStepResult.stage_advice}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── MEETING RECAP ─────────────────────────── */}
      {activeFeature === "recap" && (
        <div>
          {!recapResult && (
            <div>
              <p className="text-sm text-slate-400 mb-2">Paste your meeting notes below. AI will generate a professional follow-up email.</p>
              <textarea
                value={meetingNotes}
                onChange={(e) => setMeetingNotes(e.target.value)}
                rows={6}
                placeholder="Met with Sarah at GNC corporate. Discussed BullFit Whey placement in 200 doors. She wants to see Q3 sales data before committing. Needs samples for regional managers by June 15..."
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none mb-3"
              />
              <button
                onClick={handleGenerateRecap}
                disabled={loading || !meetingNotes.trim()}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                {loading ? "Generating..." : "Generate Recap Email"}
              </button>
            </div>
          )}
          {recapResult && (
            <div>
              <StatusBar result={recapResult} />
              {recapResult.status === "ok" && (
                <div className="space-y-4">
                  <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                    <p className="text-xs text-slate-500 mb-1">SUBJECT</p>
                    <p className="text-sm font-medium text-white mb-3">{recapResult.subject}</p>
                    <p className="text-xs text-slate-500 mb-1">BODY</p>
                    <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans">{recapResult.email_body}</pre>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-3">
                      <p className="text-xs text-slate-500 mb-1">CLEAR ASK</p>
                      <p className="text-sm text-white">{recapResult.clear_ask}</p>
                    </div>
                    <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-3">
                      <p className="text-xs text-slate-500 mb-1">TIMELINE</p>
                      <p className="text-sm text-white">{recapResult.proposed_timeline}</p>
                    </div>
                  </div>

                  {recapResult.tasks_to_create && recapResult.tasks_to_create.length > 0 && (
                    <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-3">
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Tasks to Create</p>
                      {recapResult.tasks_to_create.map((t, i) => (
                        <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-700/50 last:border-0">
                          <span className="text-sm text-white">{t.title}</span>
                          <span className="text-xs text-slate-400">{t.due_date}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {recapResult.confidence_score !== undefined && (
                    <p className="text-xs text-slate-500">
                      Confidence: {Math.round(recapResult.confidence_score * 100)}%
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── SAMPLE FOLLOW-UP ──────────────────────── */}
      {activeFeature === "followup" && (
        <div>
          {!followupResult && (
            <div>
              <p className="text-sm text-slate-400 mb-3">Generate a sample follow-up email for this buyer.</p>
              <label className="block text-xs text-slate-500 mb-1">Days since samples were sent</label>
              <input
                type="number"
                value={daysSinceSamples}
                onChange={(e) => setDaysSinceSamples(Number(e.target.value))}
                min={1}
                max={90}
                className="w-24 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none mb-3"
              />
              <div>
                <button
                  onClick={handleGenerateFollowup}
                  disabled={loading}
                  className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50"
                >
                  {loading ? "Generating..." : "Generate Follow-Up"}
                </button>
              </div>
            </div>
          )}
          {followupResult && (
            <div>
              <StatusBar result={followupResult} />
              {followupResult.status === "ok" && (
                <div className="space-y-4">
                  <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                    <p className="text-xs text-slate-500 mb-1">SUBJECT</p>
                    <p className="text-sm font-medium text-white mb-3">{followupResult.subject}</p>
                    <p className="text-xs text-slate-500 mb-1">BODY</p>
                    <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans">{followupResult.email_body}</pre>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-3">
                      <p className="text-xs text-slate-500 mb-1">CTA</p>
                      <p className="text-sm text-white">{followupResult.cta}</p>
                    </div>
                    <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-3">
                      <p className="text-xs text-slate-500 mb-1">FOLLOW-UP DATE</p>
                      <p className="text-sm text-white">{followupResult.followup_task_date}</p>
                    </div>
                  </div>

                  {followupResult.risk_flags && followupResult.risk_flags.length > 0 && (
                    <div className="rounded-lg border border-amber-700/30 bg-amber-900/10 p-3">
                      <p className="text-xs text-amber-400 uppercase tracking-wider mb-1">Risk Flags</p>
                      <div className="flex flex-wrap gap-1.5">
                        {followupResult.risk_flags.map((f, i) => (
                          <span key={i} className="rounded bg-amber-800/40 px-2 py-0.5 text-xs text-amber-300">{f}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── CALL SUMMARY ──────────────────────────── */}
      {activeFeature === "callsummary" && (
        <div>
          {!callResult && (
            <div>
              <p className="text-sm text-slate-400 mb-2">Paste your call notes or transcript. AI will extract a clean summary and tasks.</p>
              <textarea
                value={callNotes}
                onChange={(e) => setCallNotes(e.target.value)}
                rows={6}
                placeholder="Called Mike at Sprouts. He said they're interested in the protein bars for the new health section rollout in Q3. Needs a case stack proposal by next Friday. Mentioned their current vendor is having supply issues..."
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none mb-3"
              />
              <button
                onClick={handleCallSummary}
                disabled={loading || !callNotes.trim()}
                className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
              >
                {loading ? "Analyzing..." : "Extract Summary & Tasks"}
              </button>
            </div>
          )}
          {callResult && (
            <div>
              {callResult.status === "ok" && (
                <div className="space-y-4">
                  <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                    <p className="text-xs text-slate-500 mb-1">CLEAN SUMMARY</p>
                    <p className="text-sm text-slate-300">{callResult.clean_summary}</p>
                  </div>

                  {callResult.buyer_sentiment && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">BUYER SENTIMENT:</span>
                      <span className={`rounded px-2 py-0.5 text-xs font-medium ${
                        callResult.buyer_sentiment === "positive" ? "bg-green-600/20 text-green-300" :
                        callResult.buyer_sentiment === "neutral" ? "bg-slate-600/20 text-slate-300" :
                        callResult.buyer_sentiment === "cautious" ? "bg-amber-600/20 text-amber-300" :
                        "bg-red-600/20 text-red-300"
                      }`}>
                        {callResult.buyer_sentiment.toUpperCase()}
                      </span>
                    </div>
                  )}

                  {callResult.next_steps && callResult.next_steps.length > 0 && (
                    <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-3">
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Extracted Tasks</p>
                      {callResult.next_steps.map((s, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
                          <div>
                            <p className="text-sm text-white">{s.action}</p>
                            <p className="text-xs text-slate-500">Owner: {s.owner}</p>
                          </div>
                          <span className="text-xs text-slate-400">{s.due_date}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {callResult.key_objections && callResult.key_objections.length > 0 && (
                    <div className="rounded-lg border border-red-700/20 bg-red-900/10 p-3">
                      <p className="text-xs text-red-400 uppercase tracking-wider mb-1">Objections</p>
                      <ul className="space-y-1">
                        {callResult.key_objections.map((o, i) => (
                          <li key={i} className="text-sm text-red-300 flex items-start gap-1.5">
                            <span className="text-red-500 mt-0.5">&#8250;</span> {o}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {callResult.stage_change_recommendation && (
                    <div className="rounded-lg border border-indigo-500/30 bg-indigo-900/10 p-3">
                      <p className="text-xs text-indigo-400 uppercase tracking-wider mb-1">Stage Recommendation</p>
                      <p className="text-sm text-indigo-300">{callResult.stage_change_recommendation}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Regenerate button */}
      {(recapResult || followupResult || nextStepResult || callResult) && (
        <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center gap-3">
          <button
            onClick={() => {
              setRecapResult(null);
              setFollowupResult(null);
              setNextStepResult(null);
              setCallResult(null);
              setError(null);
            }}
            className="rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-1.5 text-xs text-slate-400 hover:text-white transition"
          >
            Regenerate
          </button>
          <p className="text-xs text-slate-600">AI outputs are suggestions. Always review before sending.</p>
        </div>
      )}
    </div>
  );
}
