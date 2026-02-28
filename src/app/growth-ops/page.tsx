"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  createTask,
  getSequences,
  createSequence,
  addSequenceStep,
  getTemplates,
  createTemplate,
  getReportingData,
  getDashboardStats,
  aiWeeklySummary,
  getOpportunities,
  enrollInSequence,
  getOpportunityEnrollments,
} from "@/lib/api";
import type {
  Sequence,
  Template,
  ReportingData,
  EnhancedDashboardStats,
  AIWeeklySummaryResult,
  Opportunity,
} from "@/lib/api";
import {
  RUN_BLOCKS,
  DEFAULT_TEMPLATES,
  DEFAULT_CADENCE,
  WEEKLY_METRICS_CONFIG,
  getCompletedBlocks,
  markBlockCompleted,
  todayISO,
} from "@/lib/growth-ops-engine";
import type { RunBlockConfig } from "@/lib/growth-ops-engine";
import {
  PLAYBOOK_INTRO,
  PLAYBOOK_PURPOSE,
  PLAYBOOK_RULES,
  PLAYBOOK_SECTIONS,
  DAILY_RHYTHM,
  STAGE_GUIDES,
  BUYER_PLAYBOOK,
  OUTREACH_CADENCE,
  OUTREACH_CADENCE_NOTE,
  CLOSE_RATE_TIPS,
  DOOR_EXPANSION,
  STALLED_DEAL_FIX,
  STALLED_DEAL_NOTE,
  WEEKLY_METRICS,
  WEEKLY_METRICS_NOTE,
  GREAT_REPS_DO,
  GREAT_REPS_CLOSING,
} from "@/lib/growth-ops-data";
import type { DailyBlock, StageGuide } from "@/lib/growth-ops-data";
import StalledDealWizard from "@/components/growth-ops/StalledDealWizard";
import HelpPanel from "@/components/HelpPanel";

// ---------------------------------------------------------------------------
// Tab system
// ---------------------------------------------------------------------------

type GrowthOpsTab = "execute" | "playbook" | "metrics" | "templates";

const TABS: { id: GrowthOpsTab; label: string; icon: string }[] = [
  { id: "execute", label: "Execute", icon: "\u26A1" },
  { id: "playbook", label: "Playbook", icon: "\u{1F4D6}" },
  { id: "metrics", label: "Metrics", icon: "\u{1F4CA}" },
  { id: "templates", label: "Templates", icon: "\u{1F4E7}" },
];

// ---------------------------------------------------------------------------
// Shared tiny components (from original page)
// ---------------------------------------------------------------------------

const BLOCK_COLORS: Record<string, { border: string; bg: string; text: string; dot: string }> = {
  emerald: { border: "border-emerald-700/30", bg: "bg-emerald-900/10", text: "text-emerald-400", dot: "bg-emerald-500" },
  amber: { border: "border-amber-700/30", bg: "bg-amber-900/10", text: "text-amber-400", dot: "bg-amber-500" },
  indigo: { border: "border-indigo-500/30", bg: "bg-indigo-900/10", text: "text-indigo-400", dot: "bg-indigo-500" },
  purple: { border: "border-purple-500/30", bg: "bg-purple-900/10", text: "text-purple-400", dot: "bg-purple-500" },
  red: { border: "border-red-700/30", bg: "bg-red-900/20", text: "text-red-400", dot: "bg-red-500" },
};

function Bullet({ children, color = "indigo" }: { children: React.ReactNode; color?: string }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${BLOCK_COLORS[color]?.dot ?? "bg-indigo-500"}`} />
      <span className="text-sm text-slate-300">{children}</span>
    </li>
  );
}

function CalloutBox({ children, color = "amber" }: { children: React.ReactNode; color?: "emerald" | "amber" | "indigo" | "red" }) {
  const c = BLOCK_COLORS[color] ?? BLOCK_COLORS.amber;
  return (
    <div className={`rounded-lg border ${c.border} ${c.bg} px-4 py-3`}>
      <p className={`text-sm font-medium ${c.text}`}>{children}</p>
    </div>
  );
}

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ---------------------------------------------------------------------------
// EXECUTE TAB
// ---------------------------------------------------------------------------

function ExecuteTab() {
  const [completedBlocks, setCompletedBlocks] = useState<string[]>([]);
  const [runningBlock, setRunningBlock] = useState<string | null>(null);
  const [showLinks, setShowLinks] = useState<string | null>(null);
  const [showStalledWizard, setShowStalledWizard] = useState(false);
  const [stalledCount, setStalledCount] = useState<number | null>(null);

  useEffect(() => {
    setCompletedBlocks(getCompletedBlocks());
    getDashboardStats()
      .then((stats) => {
        const stalled = (stats.today_priorities?.stalled_deals ?? []).filter(
          (d: any) => (d.days_stalled ?? 0) >= 14
        );
        setStalledCount(stalled.length);
      })
      .catch(() => {});
  }, []);

  async function runBlock(block: RunBlockConfig) {
    setRunningBlock(block.id);
    try {
      const today = todayISO();
      await Promise.all(
        block.tasks.map((t) =>
          createTask({
            title: `[GrowthOps] ${t.title}`,
            description: t.description,
            priority: t.priority,
            due_date: today,
          })
        )
      );
      markBlockCompleted(block.id);
      setCompletedBlocks(getCompletedBlocks());
      setShowLinks(block.id);
    } catch (err) {
      console.error("Failed to run block", err);
    } finally {
      setRunningBlock(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Daily Rhythm Run Blocks */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
            Daily Operating Rhythm
          </h2>
          <HelpPanel
            pageKey="growth-ops-execute"
            tagline="Three blocks a day. Every day. No exceptions. Run them in order and your pipeline stays clean."
            sections={[
              {
                title: "What Run Blocks do",
                content: [
                  "Each block creates tasks in your task list so nothing gets forgotten",
                  "After running a block, deep links appear to take you directly to the relevant CRM pages (Tasks, Pipeline, Calls)",
                  "Blocks reset every day \u2014 green checkmark means you already ran it today",
                ],
              },
              {
                title: "The daily rhythm",
                content: [
                  "Morning Block \u2014 Clear overdue tasks, review pipeline, set today\u2019s priorities",
                  "Midday Block \u2014 Make calls, send follow-ups, check for stalled deals",
                  "EOD Block \u2014 Log all activities, update next steps, plan tomorrow",
                ],
              },
              {
                title: "Stalled Deals",
                content: [
                  "Any deal with no activity for 14+ days shows up in the Stalled Deals section below",
                  "Click \u201cOpen Stalled Deal Wizard\u201d to walk through a 7-step fix: verify contacts, review history, schedule a call, loop in assistant buyer, generate AI email, offer samples, or mark cold",
                  "The wizard logs every action as an activity on the opportunity so your timeline stays complete",
                ],
              },
            ]}
          />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {RUN_BLOCKS.map((block) => {
            const c = BLOCK_COLORS[block.color];
            const isCompleted = completedBlocks.includes(block.id);
            const isRunning = runningBlock === block.id;

            return (
              <div
                key={block.id}
                className={`rounded-xl border ${isCompleted ? "border-emerald-700/30 bg-emerald-900/5" : `${c.border} ${c.bg}`} p-4`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`text-sm font-semibold ${isCompleted ? "text-emerald-400" : c.text}`}>
                    {block.icon} {block.label}
                  </h3>
                  {isCompleted && (
                    <span className="text-emerald-400 text-xs font-medium">&#10003; Done</span>
                  )}
                </div>

                <ul className="space-y-1.5 mb-4">
                  {block.tasks.map((t, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${isCompleted ? "bg-emerald-500" : c.dot}`} />
                      <span className="text-xs text-slate-400">{t.title}</span>
                    </li>
                  ))}
                </ul>

                {!isCompleted ? (
                  <button
                    onClick={() => runBlock(block)}
                    disabled={isRunning}
                    className={`w-full rounded-lg px-3 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 ${
                      block.color === "emerald"
                        ? "bg-emerald-600 hover:bg-emerald-500"
                        : block.color === "amber"
                        ? "bg-amber-600 hover:bg-amber-500"
                        : "bg-indigo-600 hover:bg-indigo-500"
                    }`}
                  >
                    {isRunning ? "Creating tasks..." : `Run ${block.label}`}
                  </button>
                ) : showLinks === block.id ? (
                  <div className="flex flex-wrap gap-2">
                    {block.deepLinks.map((link, i) => (
                      <Link
                        key={i}
                        href={link.href}
                        className="rounded-lg border border-indigo-500/30 bg-indigo-900/10 px-3 py-1.5 text-xs text-indigo-300 hover:bg-indigo-900/20 transition-colors"
                      >
                        {link.label} &rarr;
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {block.deepLinks.map((link, i) => (
                      <Link
                        key={i}
                        href={link.href}
                        className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-300 hover:border-slate-600 transition-colors"
                      >
                        {link.label} &rarr;
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Stalled Deals Queue */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
            Stalled Deals
          </h2>
          {stalledCount !== null && stalledCount > 0 && (
            <span className="rounded-full bg-amber-800/30 px-2.5 py-0.5 text-xs font-medium text-amber-300">
              {stalledCount} deal{stalledCount !== 1 ? "s" : ""} stalled 14+ days
            </span>
          )}
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
          {stalledCount === null ? (
            <p className="text-sm text-slate-400">Loading...</p>
          ) : stalledCount === 0 ? (
            <p className="text-sm text-emerald-400">No stalled deals. Keep it moving.</p>
          ) : (
            <div>
              <p className="text-sm text-slate-400 mb-3">
                {stalledCount} deal{stalledCount !== 1 ? "s" : ""} with no activity for 14+ days.
                Use the wizard to work through the 7-step fix list.
              </p>
              <button
                onClick={() => setShowStalledWizard(true)}
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500"
              >
                Open Stalled Deal Wizard
              </button>
            </div>
          )}
        </div>
      </div>

      {showStalledWizard && (
        <StalledDealWizard onClose={() => setShowStalledWizard(false)} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PLAYBOOK TAB (original static content)
// ---------------------------------------------------------------------------

function SectionHeader({ id, title }: { id: string; title: string }) {
  return <h2 id={id} className="text-lg font-semibold text-white scroll-mt-52">{title}</h2>;
}

function RhythmBlock({ block }: { block: DailyBlock }) {
  const c = BLOCK_COLORS[block.color];
  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} p-4`}>
      <h3 className={`text-sm font-semibold ${c.text} mb-3`}>{block.label}</h3>
      <ol className="space-y-2">
        {block.items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <span className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${c.dot} text-white`}>{i + 1}</span>
            <span className="text-sm text-slate-300">{item.text}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function StageCard({ guide }: { guide: StageGuide }) {
  const c = BLOCK_COLORS[guide.color];
  const insightColor = guide.insightType === "wins" ? "emerald" : "amber";
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className={`h-2.5 w-2.5 rounded-full ${c.dot}`} />
        <h3 className="text-base font-semibold text-white">{guide.stage}</h3>
      </div>
      <p className="text-sm text-indigo-300 font-medium mb-3">{guide.goal}</p>
      <ul className="space-y-1.5 mb-4">
        {guide.doThis.map((item, i) => (
          <Bullet key={i} color={guide.color}>{item}</Bullet>
        ))}
      </ul>
      <CalloutBox color={insightColor}>
        <span className="font-semibold">{guide.insightLabel}:</span> {guide.insight}
      </CalloutBox>
    </div>
  );
}

function PlaybookTab() {
  return (
    <div>
      {/* Section Nav */}
      <div className="mb-8">
        <div className="grid grid-cols-3 lg:grid-cols-9 gap-2">
          {PLAYBOOK_SECTIONS.map((section) => (
            <button key={section.id} onClick={() => scrollTo(section.id)} className="rounded-lg border border-slate-700 bg-slate-800/50 px-2 py-2 text-left hover:border-indigo-500/50 hover:bg-slate-800 transition-all">
              <span className="text-base">{section.icon}</span>
              <p className="text-xs font-semibold text-white mt-0.5 truncate">{section.title}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Daily Rhythm */}
      <section className="mb-10">
        <SectionHeader id="daily-rhythm" title="Daily Operating Rhythm" />
        <p className="text-sm text-slate-400 mt-1 mb-4">Your three blocks. Do them in order. Every day.</p>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {DAILY_RHYTHM.map((block) => <RhythmBlock key={block.id} block={block} />)}
        </div>
      </section>

      {/* Stage Playbook */}
      <section className="mb-10">
        <SectionHeader id="stage-playbook" title="What to Do by Stage" />
        <p className="text-sm text-slate-400 mt-1 mb-4">Every stage has one goal and specific actions. Do not skip steps.</p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {STAGE_GUIDES.map((guide) => <StageCard key={guide.id} guide={guide} />)}
        </div>
      </section>

      {/* Buyer Playbook */}
      <section className="mb-10">
        <SectionHeader id="buyer-playbook" title="The BullFit Buyer Playbook" />
        <div className="mt-4 space-y-4">
          <div className="rounded-xl border border-indigo-500/30 bg-indigo-900/10 p-5">
            <h3 className="text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-2">Your core pitch in one sentence</h3>
            <p className="text-base font-medium text-white leading-relaxed">&ldquo;{BUYER_PLAYBOOK.corePitch}&rdquo;</p>
            <p className="text-xs text-slate-500 mt-2">{BUYER_PLAYBOOK.corePitchNote}</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Your three proof points</h3>
              <ul className="space-y-2">{BUYER_PLAYBOOK.proofPoints.map((p, i) => <Bullet key={i}>{p}</Bullet>)}</ul>
              <p className="text-xs text-slate-500 mt-3">{BUYER_PLAYBOOK.proofPointsNote}</p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
              <h3 className="text-sm font-semibold text-white mb-3">What buyers actually want</h3>
              <ol className="space-y-2">
                {BUYER_PLAYBOOK.whatBuyersWant.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-slate-700 text-[10px] font-bold text-slate-300">{i + 1}</span>
                    <span className="text-sm text-slate-300">{item}</span>
                  </li>
                ))}
              </ol>
              <p className="text-xs text-slate-500 mt-3">{BUYER_PLAYBOOK.whatBuyersWantNote}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Outreach Cadence */}
      <section className="mb-10">
        <SectionHeader id="outreach-cadence" title="Outreach Cadence That Books Meetings" />
        <p className="text-sm text-slate-400 mt-1 mb-4">Four touches over 10 days. Follow the cadence or lose the deal.</p>
        <div className="space-y-3">
          {OUTREACH_CADENCE.map((step, i) => {
            const colors = ["indigo", "emerald", "amber", "red"];
            const c = BLOCK_COLORS[colors[i]];
            return (
              <div key={i} className={`flex gap-4 rounded-xl border border-slate-700 bg-slate-800 p-4 border-l-4 ${c.border.replace("/30", "")}`}>
                <div className="flex-shrink-0">
                  <span className={`inline-flex h-8 items-center rounded-full ${c.bg} ${c.text} px-3 text-xs font-bold`}>{step.timing}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{step.label}</p>
                  <p className="text-sm text-slate-400 mt-0.5">{step.instructions}</p>
                </div>
              </div>
            );
          })}
          <CalloutBox color="amber">{OUTREACH_CADENCE_NOTE}</CalloutBox>
        </div>
      </section>

      {/* Close Rate */}
      <section className="mb-10">
        <SectionHeader id="close-rate" title="How to Increase Close Rate" />
        <div className="mt-4 space-y-4">
          {CLOSE_RATE_TIPS.map((section, i) => (
            <div key={i} className="rounded-xl border border-slate-700 bg-slate-800 p-5">
              <h3 className="text-sm font-semibold text-white mb-3">{section.title}</h3>
              <ul className="space-y-1.5">{section.items.map((item, j) => <Bullet key={j}>{item}</Bullet>)}</ul>
              {section.callout && <div className="mt-3"><CalloutBox color="amber">{section.callout}</CalloutBox></div>}
            </div>
          ))}
        </div>
      </section>

      {/* Door Expansion */}
      <section className="mb-10">
        <SectionHeader id="door-expansion" title="How to Get Into More Doors" />
        <div className="mt-4 space-y-4">
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
            <h3 className="text-sm font-semibold text-white mb-2">Door math matters</h3>
            <p className="text-sm text-slate-400 mb-3">{DOOR_EXPANSION.doorMathIntro}</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {DOOR_EXPANSION.doorMathMetrics.map((m, i) => (
                <span key={i} className="rounded-full border border-indigo-500/30 bg-indigo-900/10 px-3 py-1 text-xs font-medium text-indigo-300">{m}</span>
              ))}
            </div>
            <CalloutBox color="amber">{DOOR_EXPANSION.doorMathNote}</CalloutBox>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Build expansion paths after first PO</h3>
            <ol className="space-y-2">
              {DOOR_EXPANSION.expansionPaths.map((p, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600/30 text-[10px] font-bold text-indigo-300">{i + 1}</span>
                  <span className="text-sm text-slate-300">{p}</span>
                </li>
              ))}
            </ol>
            <p className="text-xs text-slate-500 mt-3">{DOOR_EXPANSION.expansionNote}</p>
          </div>
        </div>
      </section>

      {/* Stalled Deals */}
      <section className="mb-10">
        <SectionHeader id="stalled-deals" title="The Stalled Deal Fix List" />
        <p className="text-sm text-slate-400 mt-1 mb-4">If a deal is stalled 14+ days, do this in order.</p>
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
          <ol className="space-y-3">
            {STALLED_DEAL_FIX.map((step) => (
              <li key={step.number} className="flex items-start gap-3">
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-amber-600/20 text-xs font-bold text-amber-300">{step.number}</span>
                <span className="text-sm text-slate-300 mt-1">{step.action}</span>
              </li>
            ))}
          </ol>
          <div className="mt-4"><CalloutBox color="red">{STALLED_DEAL_NOTE}</CalloutBox></div>
        </div>
      </section>

      {/* Weekly Metrics */}
      <section className="mb-10">
        <SectionHeader id="weekly-metrics" title="Weekly Team Metrics That Matter" />
        <p className="text-sm text-slate-400 mt-1 mb-4">Track these weekly.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {WEEKLY_METRICS.map((metric, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800 p-4">
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600/20 text-xs font-bold text-indigo-300">{i + 1}</span>
              <span className="text-sm text-slate-300">{metric}</span>
            </div>
          ))}
        </div>
        <div className="mt-4"><CalloutBox color="amber">{WEEKLY_METRICS_NOTE}</CalloutBox></div>
      </section>

      {/* Great Reps */}
      <section className="mb-4">
        <div id="great-reps" className="scroll-mt-52 rounded-xl border border-indigo-500/20 bg-gradient-to-br from-slate-800 to-slate-900 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">What Great Reps Do</h2>
          <ul className="space-y-2">{GREAT_REPS_DO.map((item, i) => <Bullet key={i} color="emerald">{item}</Bullet>)}</ul>
          <p className="mt-4 text-sm font-medium text-indigo-300">{GREAT_REPS_CLOSING}</p>
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// METRICS TAB
// ---------------------------------------------------------------------------

function MetricsTab() {
  const [reportingData, setReportingData] = useState<ReportingData | null>(null);
  const [dashStats, setDashStats] = useState<EnhancedDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState<AIWeeklySummaryResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    Promise.all([getReportingData(), getDashboardStats()])
      .then(([rep, dash]) => {
        setReportingData(rep);
        setDashStats(dash);
      })
      .catch((err) => console.error("Failed to load metrics", err))
      .finally(() => setLoading(false));
  }, []);

  function getMetricValue(key: string): number {
    if (!reportingData || !dashStats) return 0;
    const stageKey = key.replace("_", " "); // rough mapping
    const funnelMatch = reportingData.conversion_funnel?.find(
      (f) => f.stage.toLowerCase().replace(/ /g, "_") === key ||
             f.stage.toLowerCase().includes(key.replace(/_/g, " "))
    );
    switch (key) {
      case "meetings_booked":
        return reportingData.conversion_funnel?.find((f) => f.stage === "meeting_booked")?.count ?? 0;
      case "pitches_delivered":
        return reportingData.conversion_funnel?.find((f) => f.stage === "pitch_delivered")?.count ?? 0;
      case "samples_sent":
        return reportingData.conversion_funnel?.find((f) => f.stage === "samples_sent")?.count ?? 0;
      case "vendor_setups":
        return reportingData.conversion_funnel?.find((f) => f.stage === "vendor_setup")?.count ?? 0;
      case "authorizations":
        return reportingData.conversion_funnel?.find((f) => f.stage === "authorization_pending")?.count ?? 0;
      case "first_pos":
        return reportingData.conversion_funnel?.find((f) => f.stage === "po_received")?.count ?? 0;
      case "reorders":
        return reportingData.conversion_funnel?.find((f) => f.stage === "reorder_cycle")?.count ?? 0;
      case "stalled_14":
        return (dashStats.today_priorities?.stalled_deals ?? []).filter((d: any) => (d.days_stalled ?? 0) >= 14).length;
      case "missing_next_step":
        return dashStats.pipeline_summary?.missing_next_step ?? 0;
      default:
        return funnelMatch?.count ?? 0;
    }
  }

  async function generateSummary() {
    setAiLoading(true);
    try {
      const result = await aiWeeklySummary();
      setAiSummary(result);
    } catch (err) {
      console.error("Failed to generate AI summary", err);
    } finally {
      setAiLoading(false);
    }
  }

  if (loading) return <p className="text-sm text-slate-400">Loading metrics...</p>;

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
            Weekly Growth Ops Metrics
          </h2>
          <HelpPanel
            pageKey="growth-ops-metrics"
            tagline="What gets measured gets managed. These 9 metrics tell you if your pipeline is healthy or dying."
            sections={[
              {
                title: "What the metrics show",
                content: [
                  "Live data pulled from your CRM pipeline \u2014 meetings booked, pitches delivered, samples sent, vendor setups, authorizations, first POs, and reorders",
                  "Two warning metrics: deals stalled 14+ days and deals missing a next step \u2014 these show up in amber when they\u2019re above zero",
                  "All numbers update in real time every time you open this tab",
                ],
              },
              {
                title: "AI Weekly Summary",
                content: [
                  "Click \u201cGenerate Summary\u201d to get an AI-powered executive brief covering wins, stalled deals, at-risk deals, and recommended focus areas",
                  "Includes rep-by-rep performance breakdown with deal counts, stalled counts, and overdue counts",
                  "Use this in your weekly team meeting to drive accountability",
                ],
              },
              {
                title: "What to watch for",
                content: [
                  "Meetings Booked should stay above 5/week per rep",
                  "Stalled 14+ Days should always be zero \u2014 if it\u2019s not, run the Stalled Deal Wizard on the Execute tab",
                  "Missing Next Step means a deal is dying \u2014 every opportunity must have a dated next step",
                ],
              },
            ]}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {WEEKLY_METRICS_CONFIG.map((m) => {
            const value = getMetricValue(m.key);
            const isWarning = (m.key === "stalled_14" || m.key === "missing_next_step") && value > 0;
            return (
              <div
                key={m.key}
                className={`rounded-xl border p-4 ${
                  isWarning ? "border-amber-700/30 bg-amber-900/10" : "border-slate-700 bg-slate-800"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg">{m.icon}</span>
                  <span className={`text-2xl font-bold ${isWarning ? "text-amber-400" : "text-white"}`}>
                    {value}
                  </span>
                </div>
                <p className="text-sm font-medium text-white mt-2">{m.label}</p>
                <p className="text-xs text-slate-500">{m.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Weekly Summary */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
            AI Weekly Summary
          </h2>
          <button
            onClick={generateSummary}
            disabled={aiLoading}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {aiLoading ? "Generating..." : aiSummary ? "Regenerate" : "Generate Summary"}
          </button>
        </div>

        {aiSummary ? (
          <div className="rounded-xl border border-indigo-500/20 bg-gradient-to-br from-slate-800 to-slate-900 p-5 space-y-4">
            {aiSummary.wins_this_week && (
              <div>
                <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">Wins</p>
                <p className="text-sm text-slate-300">{aiSummary.wins_this_week}</p>
              </div>
            )}
            {aiSummary.stalled_deals && (
              <div>
                <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">Stalled Deals</p>
                <p className="text-sm text-slate-300">{aiSummary.stalled_deals}</p>
              </div>
            )}
            {aiSummary.risk_deals && (
              <div>
                <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-1">At Risk</p>
                <p className="text-sm text-slate-300">{aiSummary.risk_deals}</p>
              </div>
            )}
            {aiSummary.recommended_focus && (
              <div>
                <p className="text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-1">Recommended Focus</p>
                <p className="text-sm text-slate-300">{aiSummary.recommended_focus}</p>
              </div>
            )}
            {aiSummary.rep_performance && aiSummary.rep_performance.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-white uppercase tracking-wider mb-2">Rep Performance</p>
                <div className="space-y-2">
                  {aiSummary.rep_performance.map((rep, i) => (
                    <div key={i} className="rounded-lg border border-slate-700 bg-slate-800 p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">{rep.rep_name}</p>
                        <p className="text-xs text-slate-400">{rep.assessment}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-white">{rep.deals} deals</p>
                        <p className="text-xs text-slate-500">
                          {rep.stalled_count} stalled &bull; {rep.overdue_count} overdue
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : !aiLoading ? (
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-6 text-center">
            <p className="text-sm text-slate-400">
              Click &ldquo;Generate Summary&rdquo; to get an AI-powered weekly executive summary with wins, risks, and rep performance.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TEMPLATES TAB
// ---------------------------------------------------------------------------

function TemplatesTab() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [seedingId, setSeedingId] = useState<string | null>(null);
  const [seedingAll, setSeedingAll] = useState(false);
  const [creatingCadence, setCreatingCadence] = useState(false);
  const [enrollModal, setEnrollModal] = useState<string | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [enrollingOpp, setEnrollingOpp] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [t, s] = await Promise.all([getTemplates(), getSequences()]);
      setTemplates(t);
      setSequences(s);
    } catch (err) {
      console.error("Failed to load templates/sequences", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const existingNames = new Set(templates.map((t) => t.name));
  const missingTemplates = DEFAULT_TEMPLATES.filter((t) => !existingNames.has(t.name));
  const cadenceSequence = sequences.find((s) => s.name === DEFAULT_CADENCE.name);

  async function seedTemplate(tmpl: typeof DEFAULT_TEMPLATES[0]) {
    setSeedingId(tmpl.name);
    try {
      await createTemplate({
        name: tmpl.name,
        category: tmpl.category,
        subject: tmpl.subject,
        body: tmpl.body,
        stage: tmpl.stage,
        variables: tmpl.variables,
      });
      await fetchData();
    } catch (err) {
      console.error("Failed to seed template", err);
    } finally {
      setSeedingId(null);
    }
  }

  async function seedAllMissing() {
    setSeedingAll(true);
    try {
      for (const tmpl of missingTemplates) {
        await createTemplate({
          name: tmpl.name,
          category: tmpl.category,
          subject: tmpl.subject,
          body: tmpl.body,
          stage: tmpl.stage,
          variables: tmpl.variables,
        });
      }
      await fetchData();
    } catch (err) {
      console.error("Failed to seed templates", err);
    } finally {
      setSeedingAll(false);
    }
  }

  async function createCadenceSequence() {
    setCreatingCadence(true);
    try {
      const seq = await createSequence({
        name: DEFAULT_CADENCE.name,
        description: DEFAULT_CADENCE.description,
        target_stage: DEFAULT_CADENCE.target_stage,
      });
      for (const step of DEFAULT_CADENCE.steps) {
        await addSequenceStep(seq.id, {
          channel: step.channel,
          delay_days: step.delay_days,
          notes: step.notes,
        });
      }
      await fetchData();
    } catch (err) {
      console.error("Failed to create cadence", err);
    } finally {
      setCreatingCadence(false);
    }
  }

  async function openEnrollModal(seqId: string) {
    setEnrollModal(seqId);
    try {
      const opps = await getOpportunities();
      setOpportunities(opps);
    } catch (err) {
      console.error("Failed to load opportunities", err);
    }
  }

  async function enrollOpp(seqId: string, oppId: string) {
    setEnrollingOpp(oppId);
    try {
      await enrollInSequence(seqId, oppId);
      setEnrollModal(null);
    } catch (err) {
      console.error("Failed to enroll", err);
    } finally {
      setEnrollingOpp(null);
    }
  }

  if (loading) return <p className="text-sm text-slate-400">Loading templates...</p>;

  return (
    <div className="space-y-6">
      {/* Outreach Cadence */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
            Buyer Intro 10-Day Cadence
          </h2>
          <HelpPanel
            pageKey="growth-ops-templates"
            tagline="Pre-built email templates and a 4-touch outreach sequence. Seed them once, use them on every deal."
            sections={[
              {
                title: "Outreach Cadence",
                content: [
                  "A 4-step sequence over 10 days: intro email (Day 0), value add (Day 2), phone call (Day 4), breakup email (Day 7)",
                  "Click \u201cCreate Cadence Sequence\u201d to add it to your Sequences page \u2014 it only needs to be created once",
                  "Use \u201cStart Cadence\u201d to enroll any opportunity into the sequence and auto-schedule the touches",
                ],
              },
              {
                title: "Email Templates",
                content: [
                  "6 default templates covering the full sales cycle: Buyer Intro, Post-Meeting Recap, Sample Offer, Vendor Setup Nudge, Reorder Check-In, and Breakup Email",
                  "Click \u201cSeed All Missing\u201d to create all templates at once, or seed them individually",
                  "Green checkmarks mean the template already exists \u2014 you can edit them on the Sequences page",
                  "Each template is tagged to a pipeline stage so the AI knows when to suggest it",
                ],
              },
              {
                title: "Tips",
                content: [
                  "Customize the templates after seeding \u2014 add your own voice and specific product details",
                  "The AI email generator on the Playbook tab uses these templates as a starting point",
                  "Always follow up within 48 hours of a meeting \u2014 the Post-Meeting Recap template is designed for this",
                ],
              },
            ]}
          />
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
          <div className="space-y-2 mb-4">
            {DEFAULT_CADENCE.steps.map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600/20 text-[10px] font-bold text-indigo-300">
                  {i + 1}
                </span>
                <span className="text-xs text-slate-500 w-12">{step.channel}</span>
                <span className="text-sm text-slate-300 flex-1">{step.notes}</span>
                <span className="text-xs text-slate-500">Day {step.delay_days}</span>
              </div>
            ))}
          </div>

          {cadenceSequence ? (
            <div className="flex items-center gap-3">
              <span className="text-emerald-400 text-xs font-medium">&#10003; Sequence exists</span>
              <Link
                href={`/sequences/${cadenceSequence.id}`}
                className="rounded-lg border border-indigo-500/30 px-3 py-1.5 text-xs text-indigo-300 hover:bg-indigo-900/10"
              >
                View Sequence
              </Link>
              <button
                onClick={() => openEnrollModal(cadenceSequence.id)}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
              >
                Start Cadence
              </button>
            </div>
          ) : (
            <button
              onClick={createCadenceSequence}
              disabled={creatingCadence}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {creatingCadence ? "Creating..." : "Create Cadence Sequence"}
            </button>
          )}
        </div>
      </div>

      {/* Enroll Modal */}
      {enrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-800 p-6">
            <h3 className="text-base font-semibold text-white mb-3">Start Cadence</h3>
            <p className="text-sm text-slate-400 mb-4">Select an opportunity to enroll:</p>
            {opportunities.length === 0 ? (
              <p className="text-sm text-slate-500">No opportunities found.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {opportunities.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => enrollOpp(enrollModal, o.id)}
                    disabled={enrollingOpp === o.id}
                    className="w-full text-left rounded-lg border border-slate-700 bg-slate-900 p-3 hover:border-indigo-500/50 transition-all disabled:opacity-50"
                  >
                    <p className="text-sm font-medium text-white">{o.title}</p>
                    <p className="text-xs text-slate-400">{o.account_name} &bull; {o.stage}</p>
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => setEnrollModal(null)}
              className="mt-4 w-full rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Email Templates */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
            Email Templates
          </h2>
          {missingTemplates.length > 0 && (
            <button
              onClick={seedAllMissing}
              disabled={seedingAll}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {seedingAll ? "Seeding..." : `Seed All Missing (${missingTemplates.length})`}
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {DEFAULT_TEMPLATES.map((tmpl) => {
            const exists = existingNames.has(tmpl.name);
            return (
              <div
                key={tmpl.name}
                className={`rounded-xl border p-4 ${
                  exists ? "border-emerald-700/30 bg-emerald-900/5" : "border-slate-700 bg-slate-800"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-white">{tmpl.name}</h3>
                  {exists ? (
                    <span className="text-emerald-400 text-xs">&#10003;</span>
                  ) : (
                    <button
                      onClick={() => seedTemplate(tmpl)}
                      disabled={seedingId === tmpl.name}
                      className="rounded bg-indigo-600/20 px-2 py-0.5 text-[10px] text-indigo-300 hover:bg-indigo-600/30 disabled:opacity-50"
                    >
                      {seedingId === tmpl.name ? "..." : "Seed"}
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-500 mb-1">Stage: {tmpl.stage.replace(/_/g, " ")}</p>
                <p className="text-xs text-slate-400 line-clamp-2">{tmpl.subject}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MAIN PAGE
// ---------------------------------------------------------------------------

export default function GrowthOpsPage() {
  const [activeTab, setActiveTab] = useState<GrowthOpsTab>("execute");

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <div className="mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Growth Ops</h1>
            <p className="mt-1 text-sm text-slate-400 max-w-2xl">{PLAYBOOK_INTRO}</p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <HelpPanel
              pageKey="growth-ops"
              tagline="Your execution engine. Strategy means nothing without daily action. This page turns the playbook into tasks, cadences, and measurable metrics."
              sections={[
                {
                  title: "What it is",
                  content: [
                    "Growth Ops is the operating system for BullFit retail sales. It combines a reference playbook, daily execution blocks, live metrics, and email templates into one hub.",
                  ],
                },
                {
                  title: "The four tabs",
                  content: [
                    "Execute \u2014 Run your daily Morning/Midday/EOD blocks. Each block creates tasks and links you straight to Pipeline, Tasks, and Calls",
                    "Playbook \u2014 The full reference guide: what to do at every stage, buyer pitch, outreach cadence, close-rate tips, and stalled deal fix list",
                    "Metrics \u2014 Live weekly metrics pulled from your CRM data plus an AI-generated executive summary",
                    "Templates \u2014 Seed 6 default email templates and a 10-day outreach cadence sequence in one click",
                  ],
                },
                {
                  title: "How to use it daily",
                  content: [
                    "Open this page every morning and run the Morning Block first",
                    "Before lunch, run Midday Block to check pipeline health and follow up on stalled deals",
                    "At end of day, run EOD Block to plan tomorrow and log activities",
                    "If any deals are stalled 14+ days, use the Stalled Deal Wizard on the Execute tab to work through the 7-step fix list",
                  ],
                },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Purpose */}
      <div className="mb-5 rounded-xl border border-indigo-500/20 bg-gradient-to-br from-slate-800 to-slate-900 p-4">
        <div className="flex flex-wrap gap-3">
          {PLAYBOOK_PURPOSE.map((item, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600/30 text-[10px] font-bold text-indigo-300">{i + 1}</span>
              <span className="text-xs text-slate-300">{item}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Rules */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {PLAYBOOK_RULES.map((rule) => (
          <div key={rule.number} className="rounded-xl border border-slate-700 bg-slate-800 p-3">
            <span className="text-lg font-bold text-indigo-400">{rule.number}</span>
            <p className="mt-1 text-xs text-slate-300 leading-snug">{rule.text}</p>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div className="mb-6 flex gap-1 border-b border-slate-800 pb-px">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-slate-800 text-white border-b-2 border-indigo-500"
                : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/50"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "execute" && <ExecuteTab />}
      {activeTab === "playbook" && <PlaybookTab />}
      {activeTab === "metrics" && <MetricsTab />}
      {activeTab === "templates" && <TemplatesTab />}
    </div>
  );
}
