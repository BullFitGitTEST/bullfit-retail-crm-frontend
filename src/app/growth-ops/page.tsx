"use client";

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

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ---------------------------------------------------------------------------
// Color helpers
// ---------------------------------------------------------------------------

const BLOCK_COLORS: Record<string, { border: string; bg: string; text: string; dot: string }> = {
  emerald: {
    border: "border-emerald-700/30",
    bg: "bg-emerald-900/10",
    text: "text-emerald-400",
    dot: "bg-emerald-500",
  },
  amber: {
    border: "border-amber-700/30",
    bg: "bg-amber-900/10",
    text: "text-amber-400",
    dot: "bg-amber-500",
  },
  indigo: {
    border: "border-indigo-500/30",
    bg: "bg-indigo-900/10",
    text: "text-indigo-400",
    dot: "bg-indigo-500",
  },
  purple: {
    border: "border-purple-500/30",
    bg: "bg-purple-900/10",
    text: "text-purple-400",
    dot: "bg-purple-500",
  },
  red: {
    border: "border-red-700/30",
    bg: "bg-red-900/20",
    text: "text-red-400",
    dot: "bg-red-500",
  },
};

// ---------------------------------------------------------------------------
// Reusable tiny components
// ---------------------------------------------------------------------------

function SectionHeader({ id, title }: { id: string; title: string }) {
  return (
    <h2 id={id} className="text-lg font-semibold text-white scroll-mt-52">
      {title}
    </h2>
  );
}

function Bullet({ children, color = "indigo" }: { children: React.ReactNode; color?: string }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${BLOCK_COLORS[color]?.dot ?? "bg-indigo-500"}`} />
      <span className="text-sm text-slate-300">{children}</span>
    </li>
  );
}

function CalloutBox({
  children,
  color = "amber",
}: {
  children: React.ReactNode;
  color?: "emerald" | "amber" | "indigo" | "red";
}) {
  const c = BLOCK_COLORS[color] ?? BLOCK_COLORS.amber;
  return (
    <div className={`rounded-lg border ${c.border} ${c.bg} px-4 py-3`}>
      <p className={`text-sm font-medium ${c.text}`}>{children}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Daily Rhythm Block
// ---------------------------------------------------------------------------

function RhythmBlock({ block }: { block: DailyBlock }) {
  const c = BLOCK_COLORS[block.color];
  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} p-4`}>
      <h3 className={`text-sm font-semibold ${c.text} mb-3`}>{block.label}</h3>
      <ol className="space-y-2">
        {block.items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <span className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${c.dot} text-white`}>
              {i + 1}
            </span>
            <span className="text-sm text-slate-300">{item.text}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stage Card
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Outreach Timeline
// ---------------------------------------------------------------------------

function OutreachTimeline() {
  const colors = ["indigo", "emerald", "amber", "red"];
  return (
    <div className="space-y-3">
      {OUTREACH_CADENCE.map((step, i) => {
        const c = BLOCK_COLORS[colors[i]];
        return (
          <div key={i} className={`flex gap-4 rounded-xl border border-slate-700 bg-slate-800 p-4 border-l-4 ${c.border.replace("/30", "")}`}>
            <div className="flex-shrink-0">
              <span className={`inline-flex h-8 items-center rounded-full ${c.bg} ${c.text} px-3 text-xs font-bold`}>
                {step.timing}
              </span>
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
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function GrowthOpsPage() {
  return (
    <div>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Growth Ops</h1>
        <p className="mt-2 text-sm text-slate-400 max-w-2xl">{PLAYBOOK_INTRO}</p>
      </div>

      {/* ── Purpose ────────────────────────────────────────────── */}
      <div className="mb-6 rounded-xl border border-indigo-500/20 bg-gradient-to-br from-slate-800 to-slate-900 p-5">
        <h2 className="text-sm font-semibold text-indigo-300 uppercase tracking-wider mb-3">
          What Growth Ops is for
        </h2>
        <ol className="space-y-1.5">
          {PLAYBOOK_PURPOSE.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600/30 text-[10px] font-bold text-indigo-300">
                {i + 1}
              </span>
              <span className="text-sm text-slate-300">{item}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* ── The 5 Rules ────────────────────────────────────────── */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">The Rules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {PLAYBOOK_RULES.map((rule) => (
            <div
              key={rule.number}
              className="rounded-xl border border-slate-700 bg-slate-800 p-4"
            >
              <span className="text-lg font-bold text-indigo-400">{rule.number}</span>
              <p className="mt-1 text-sm text-slate-300 leading-snug">{rule.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section Nav (sticky) ───────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-slate-900 py-3 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 border-b border-slate-800 mb-8">
        <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-9 gap-2">
          {PLAYBOOK_SECTIONS.map((section) => (
            <button
              key={section.id}
              onClick={() => scrollTo(section.id)}
              className="rounded-lg border border-slate-700 bg-slate-800/50 px-2 py-2 text-left hover:border-indigo-500/50 hover:bg-slate-800 transition-all"
            >
              <span className="text-base">{section.icon}</span>
              <p className="text-xs font-semibold text-white mt-0.5 truncate">{section.title}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ── SECTION 1: Daily Operating Rhythm ──────────────────── */}
      <section className="mb-10">
        <SectionHeader id="daily-rhythm" title="Daily Operating Rhythm" />
        <p className="text-sm text-slate-400 mt-1 mb-4">
          Your three blocks. Do them in order. Every day.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {DAILY_RHYTHM.map((block) => (
            <RhythmBlock key={block.id} block={block} />
          ))}
        </div>
      </section>

      {/* ── SECTION 2: Stage Playbook ──────────────────────────── */}
      <section className="mb-10">
        <SectionHeader id="stage-playbook" title="What to Do by Stage" />
        <p className="text-sm text-slate-400 mt-1 mb-4">
          Every stage has one goal and specific actions. Do not skip steps.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {STAGE_GUIDES.map((guide) => (
            <StageCard key={guide.id} guide={guide} />
          ))}
        </div>
      </section>

      {/* ── SECTION 3: Buyer Playbook ──────────────────────────── */}
      <section className="mb-10">
        <SectionHeader id="buyer-playbook" title="The BullFit Buyer Playbook" />
        <div className="mt-4 space-y-4">
          {/* Core pitch */}
          <div className="rounded-xl border border-indigo-500/30 bg-indigo-900/10 p-5">
            <h3 className="text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-2">
              Your core pitch in one sentence
            </h3>
            <p className="text-base font-medium text-white leading-relaxed">
              &ldquo;{BUYER_PLAYBOOK.corePitch}&rdquo;
            </p>
            <p className="text-xs text-slate-500 mt-2">{BUYER_PLAYBOOK.corePitchNote}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Proof points */}
            <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Your three proof points</h3>
              <ul className="space-y-2">
                {BUYER_PLAYBOOK.proofPoints.map((point, i) => (
                  <Bullet key={i}>{point}</Bullet>
                ))}
              </ul>
              <p className="text-xs text-slate-500 mt-3">{BUYER_PLAYBOOK.proofPointsNote}</p>
            </div>

            {/* What buyers want */}
            <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
              <h3 className="text-sm font-semibold text-white mb-3">What buyers actually want</h3>
              <ol className="space-y-2">
                {BUYER_PLAYBOOK.whatBuyersWant.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-slate-700 text-[10px] font-bold text-slate-300">
                      {i + 1}
                    </span>
                    <span className="text-sm text-slate-300">{item}</span>
                  </li>
                ))}
              </ol>
              <p className="text-xs text-slate-500 mt-3">{BUYER_PLAYBOOK.whatBuyersWantNote}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 4: Outreach Cadence ────────────────────────── */}
      <section className="mb-10">
        <SectionHeader id="outreach-cadence" title="Outreach Cadence That Books Meetings" />
        <p className="text-sm text-slate-400 mt-1 mb-4">
          Four touches over 10 days. Follow the cadence or lose the deal.
        </p>
        <OutreachTimeline />
      </section>

      {/* ── SECTION 5: Increase Close Rate ─────────────────────── */}
      <section className="mb-10">
        <SectionHeader id="close-rate" title="How to Increase Close Rate" />
        <div className="mt-4 space-y-4">
          {CLOSE_RATE_TIPS.map((section, i) => (
            <div key={i} className="rounded-xl border border-slate-700 bg-slate-800 p-5">
              <h3 className="text-sm font-semibold text-white mb-3">{section.title}</h3>
              <ul className="space-y-1.5">
                {section.items.map((item, j) => (
                  <Bullet key={j}>{item}</Bullet>
                ))}
              </ul>
              {section.callout && (
                <div className="mt-3">
                  <CalloutBox color="amber">{section.callout}</CalloutBox>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTION 6: Get Into More Doors ─────────────────────── */}
      <section className="mb-10">
        <SectionHeader id="door-expansion" title="How to Get Into More Doors" />
        <div className="mt-4 space-y-4">
          {/* Door math */}
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
            <h3 className="text-sm font-semibold text-white mb-2">Door math matters</h3>
            <p className="text-sm text-slate-400 mb-3">{DOOR_EXPANSION.doorMathIntro}</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {DOOR_EXPANSION.doorMathMetrics.map((metric, i) => (
                <span
                  key={i}
                  className="rounded-full border border-indigo-500/30 bg-indigo-900/10 px-3 py-1 text-xs font-medium text-indigo-300"
                >
                  {metric}
                </span>
              ))}
            </div>
            <CalloutBox color="amber">{DOOR_EXPANSION.doorMathNote}</CalloutBox>
          </div>

          {/* Expansion paths */}
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Build expansion paths after first PO</h3>
            <ol className="space-y-2">
              {DOOR_EXPANSION.expansionPaths.map((path, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600/30 text-[10px] font-bold text-indigo-300">
                    {i + 1}
                  </span>
                  <span className="text-sm text-slate-300">{path}</span>
                </li>
              ))}
            </ol>
            <p className="text-xs text-slate-500 mt-3">{DOOR_EXPANSION.expansionNote}</p>
          </div>
        </div>
      </section>

      {/* ── SECTION 7: Stalled Deal Fix List ───────────────────── */}
      <section className="mb-10">
        <SectionHeader id="stalled-deals" title="The Stalled Deal Fix List" />
        <p className="text-sm text-slate-400 mt-1 mb-4">
          If a deal is stalled 14+ days, do this in order.
        </p>
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
          <ol className="space-y-3">
            {STALLED_DEAL_FIX.map((step) => (
              <li key={step.number} className="flex items-start gap-3">
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-amber-600/20 text-xs font-bold text-amber-300">
                  {step.number}
                </span>
                <span className="text-sm text-slate-300 mt-1">{step.action}</span>
              </li>
            ))}
          </ol>
          <div className="mt-4">
            <CalloutBox color="red">{STALLED_DEAL_NOTE}</CalloutBox>
          </div>
        </div>
      </section>

      {/* ── SECTION 8: Weekly Metrics ──────────────────────────── */}
      <section className="mb-10">
        <SectionHeader id="weekly-metrics" title="Weekly Team Metrics That Matter" />
        <p className="text-sm text-slate-400 mt-1 mb-4">Track these weekly.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {WEEKLY_METRICS.map((metric, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800 p-4"
            >
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600/20 text-xs font-bold text-indigo-300">
                {i + 1}
              </span>
              <span className="text-sm text-slate-300">{metric}</span>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <CalloutBox color="amber">{WEEKLY_METRICS_NOTE}</CalloutBox>
        </div>
      </section>

      {/* ── SECTION 9: What Great Reps Do ──────────────────────── */}
      <section className="mb-4">
        <div
          id="great-reps"
          className="scroll-mt-52 rounded-xl border border-indigo-500/20 bg-gradient-to-br from-slate-800 to-slate-900 p-6"
        >
          <h2 className="text-lg font-semibold text-white mb-4">What Great Reps Do</h2>
          <ul className="space-y-2">
            {GREAT_REPS_DO.map((item, i) => (
              <Bullet key={i} color="emerald">{item}</Bullet>
            ))}
          </ul>
          <p className="mt-4 text-sm font-medium text-indigo-300">{GREAT_REPS_CLOSING}</p>
        </div>
      </section>
    </div>
  );
}
