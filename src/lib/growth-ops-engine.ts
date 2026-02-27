// ---------------------------------------------------------------------------
// Growth Ops Execution Engine — Utilities, configs, and constants
// ---------------------------------------------------------------------------

import type { Task, Opportunity } from "./api";

// ---------------------------------------------------------------------------
// Task naming convention (links tasks to opportunities without backend change)
// ---------------------------------------------------------------------------

const GROWTH_OPS_PREFIX = "[GrowthOps]";

export interface ParsedGrowthOpsTask {
  isGrowthOpsTask: boolean;
  action: string;
  oppTitle: string | null;
  oppId: string | null;
}

export function formatGrowthOpsTaskTitle(action: string, opp?: Opportunity): string {
  if (!opp) return `${GROWTH_OPS_PREFIX} ${action}`;
  return `${GROWTH_OPS_PREFIX} ${action} | Opp: ${opp.title}`;
}

export function formatGrowthOpsTaskDescription(action: string, opp?: Opportunity): string {
  if (!opp) return action;
  return `${action}\n\nOpportunity: ${opp.title}\nAccount: ${opp.account_name ?? "—"}\nStage: ${opp.stage}\nID: ${opp.id}`;
}

export function parseGrowthOpsTask(task: Task): ParsedGrowthOpsTask {
  if (!task.title.startsWith(GROWTH_OPS_PREFIX)) {
    return { isGrowthOpsTask: false, action: task.title, oppTitle: null, oppId: null };
  }
  const rest = task.title.slice(GROWTH_OPS_PREFIX.length).trim();
  const pipeIdx = rest.indexOf(" | Opp: ");
  if (pipeIdx === -1) {
    return { isGrowthOpsTask: true, action: rest, oppTitle: null, oppId: null };
  }
  const action = rest.slice(0, pipeIdx);
  const oppTitle = rest.slice(pipeIdx + 8);
  // Try to extract opp ID from description
  const idMatch = task.description?.match(/ID:\s*([a-f0-9-]+)/i);
  return { isGrowthOpsTask: true, action, oppTitle, oppId: idMatch?.[1] ?? null };
}

// ---------------------------------------------------------------------------
// Daily Rhythm Run Block Configs
// ---------------------------------------------------------------------------

export interface RunBlockTask {
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
}

export interface DeepLink {
  label: string;
  href: string;
}

export interface RunBlockConfig {
  id: "morning" | "midday" | "eod";
  label: string;
  color: "emerald" | "amber" | "indigo";
  icon: string;
  tasks: RunBlockTask[];
  deepLinks: DeepLink[];
}

export const RUN_BLOCKS: RunBlockConfig[] = [
  {
    id: "morning",
    label: "Morning Block",
    color: "emerald",
    icon: "\u2600\uFE0F",
    tasks: [
      {
        title: "Clear overdue tasks",
        description: "Review and complete or reschedule all overdue tasks before starting new work",
        priority: "high",
      },
      {
        title: "Add 5 new prospects",
        description: "Fill the top of funnel — find 5 new retail prospects if pipeline is thin",
        priority: "medium",
      },
    ],
    deepLinks: [
      { label: "Overdue Tasks", href: "/tasks?filter=overdue" },
      { label: "No Next Step", href: "/pipeline?filter=no_next_step" },
      { label: "Stalled Deals", href: "/pipeline?filter=stalled" },
    ],
  },
  {
    id: "midday",
    label: "Midday Block",
    color: "amber",
    icon: "\u{1F4DE}",
    tasks: [
      {
        title: "Outreach block — 60 minutes",
        description: "Execute outreach cadences: emails, calls, follow-ups",
        priority: "high",
      },
      {
        title: "Log calls and notes",
        description: "Update CRM with all call outcomes and meeting notes from today",
        priority: "medium",
      },
    ],
    deepLinks: [
      { label: "Prospects", href: "/prospects" },
      { label: "Call Log", href: "/calls" },
    ],
  },
  {
    id: "eod",
    label: "End of Day Block",
    color: "indigo",
    icon: "\u{1F319}",
    tasks: [
      {
        title: "Set next step dates for all active opps",
        description: "Every active opportunity must have a next step date — no exceptions",
        priority: "high",
      },
      {
        title: "Pick top 3 deals to advance tomorrow",
        description: "Identify the 3 deals with highest impact and plan tomorrow's actions",
        priority: "medium",
      },
    ],
    deepLinks: [
      { label: "Today\u2019s Tasks", href: "/tasks?filter=today" },
      { label: "Pipeline", href: "/pipeline" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Default Template Definitions
// ---------------------------------------------------------------------------

export interface DefaultTemplate {
  name: string;
  category: string;
  subject: string;
  body: string;
  stage: string;
  variables: string[];
}

export const DEFAULT_TEMPLATES: DefaultTemplate[] = [
  {
    name: "Buyer Intro Email",
    category: "email",
    subject: "Quick intro — {{brand}} for {{retailer}}",
    stage: "first_touch",
    variables: ["brand", "retailer", "buyer_name"],
    body: `Hi {{buyer_name}},

Quick intro — I'm reaching out because {{retailer}} looks like a great fit for {{brand}}.

Three reasons this could work:
• [Proof point 1 — velocity or repeat purchase data]
• [Proof point 2 — packaging/brand differentiation]
• [Proof point 3 — operational readiness]

Would you have 15 minutes next [Tuesday or Wednesday] to see if there's a fit?

[Your clear ask + two time windows]`,
  },
  {
    name: "Post-Meeting Recap",
    category: "email",
    subject: "Recap — {{brand}} x {{retailer}} next steps",
    stage: "pitch_delivered",
    variables: ["brand", "retailer", "buyer_name", "next_step", "date"],
    body: `Hi {{buyer_name}},

Thanks for the time today. Quick recap:

• [Key discussion point 1]
• [Key discussion point 2]
• [What they need to say yes]

Next step: {{next_step}} by {{date}}.

I'll send [samples/info/pricing] by [date]. Let me know if anything changes on your end.

[One clear ask + timeline]`,
  },
  {
    name: "Sample Offer",
    category: "email",
    subject: "Samples ready — {{brand}} for {{retailer}}",
    stage: "samples_sent",
    variables: ["brand", "retailer", "buyer_name"],
    body: `Hi {{buyer_name}},

Samples are ready to ship. I can get them out today with tracking.

What's the best shipping address?

I'll follow up in 5 business days after delivery to get your feedback and discuss next steps.

[Clear ask: confirm address + 5-day follow-up window]`,
  },
  {
    name: "Vendor Setup Nudge",
    category: "email",
    subject: "Vendor setup — {{brand}} for {{retailer}}",
    stage: "vendor_setup",
    variables: ["brand", "retailer", "buyer_name"],
    body: `Hi {{buyer_name}},

Following up on vendor setup. We're ready on our end — just need:

• [Missing form / document / portal access]
• [Distribution confirmation]
• [Pricing / case pack confirmation]

Can we knock this out by [date]? Happy to jump on a quick call if it's easier.

[Clear ask + date window]`,
  },
  {
    name: "Reorder Check-In",
    category: "email",
    subject: "Reorder check — {{brand}} at {{retailer}}",
    stage: "reorder_cycle",
    variables: ["brand", "retailer", "buyer_name"],
    body: `Hi {{buyer_name}},

Checking in on {{brand}} performance at {{retailer}}.

• How's velocity looking?
• Any SKUs that need attention?
• Ready to reorder or expand doors?

Would [Tuesday or Thursday] work for a quick 10-minute check-in?

[Clear ask: reorder timing + expansion conversation]`,
  },
  {
    name: "Breakup Email",
    category: "email",
    subject: "Closing the loop — {{brand}}",
    stage: "follow_up",
    variables: ["brand", "buyer_name"],
    body: `Hi {{buyer_name}},

I've reached out a few times and haven't heard back, so I'll assume the timing isn't right.

No hard feelings — I'll close this out for now.

If things change or you're looking at the category again, I'm here.

[Polite close + open door]`,
  },
];

// ---------------------------------------------------------------------------
// Default Outreach Cadence Sequence
// ---------------------------------------------------------------------------

export const DEFAULT_CADENCE = {
  name: "Buyer Intro 10-Day Cadence",
  description: "4-step outreach cadence from Growth Ops playbook. Short emails, one call, breakup.",
  target_stage: "first_touch",
  steps: [
    { channel: "email", delay_days: 0, notes: "Day 1: Short intro with 3 bullets. One ask. Two time windows." },
    { channel: "email", delay_days: 2, notes: "Day 3: Re-send with a shorter ask. Mention samples." },
    { channel: "call_script", delay_days: 4, notes: "Day 5: Call and leave a voicemail. Send email right after referencing the call." },
    { channel: "email", delay_days: 7, notes: "Day 8\u201310: Breakup email. Polite. Direct. Ends with ask." },
  ] as const,
};

// ---------------------------------------------------------------------------
// Stage Playbook Configs (maps CRM stages to Growth Ops guidance)
// ---------------------------------------------------------------------------

export interface StagePlaybookConfig {
  crmStages: string[];  // which CRM stages this maps to
  growthOpsStage: string;  // "Lead" | "Contacted" | "Interested" | "Partner"
  goal: string;
  tasks: { title: string; dueDaysOffset: number; priority: "high" | "medium" | "low" }[];
  enforcementWarnings: string[];
}

export const STAGE_PLAYBOOKS: StagePlaybookConfig[] = [
  {
    crmStages: ["targeted", "contact_found", "first_touch"],
    growthOpsStage: "Lead",
    goal: "Find the right buyer and get a meeting.",
    tasks: [
      { title: "Confirm retailer fit", dueDaysOffset: 0, priority: "high" },
      { title: "Identify buyer and assistant buyer", dueDaysOffset: 0, priority: "high" },
      { title: "Send intro email with a single ask", dueDaysOffset: 0, priority: "high" },
      { title: "Follow up email", dueDaysOffset: 2, priority: "medium" },
      { title: "Call if no response", dueDaysOffset: 4, priority: "medium" },
    ],
    enforcementWarnings: [
      "Must have a buyer name and contact method — otherwise you have a logo, not a lead.",
    ],
  },
  {
    crmStages: ["meeting_booked"],
    growthOpsStage: "Contacted",
    goal: "Get a meeting on the calendar.",
    tasks: [
      { title: "Send short intro with 3 bullets", dueDaysOffset: 0, priority: "high" },
      { title: "Include one clear ask: 15-min buyer call next week", dueDaysOffset: 0, priority: "high" },
      { title: "Follow up #1", dueDaysOffset: 3, priority: "medium" },
      { title: "Follow up #2", dueDaysOffset: 7, priority: "medium" },
      { title: "Follow up #3", dueDaysOffset: 10, priority: "medium" },
    ],
    enforcementWarnings: [
      "Your ask must be specific — not 'what do you think' but 'meeting with a reason.'",
    ],
  },
  {
    crmStages: ["pitch_delivered", "follow_up"],
    growthOpsStage: "Interested",
    goal: "Deliver a pitch and get commitment to next step.",
    tasks: [
      { title: "Book pitch meeting", dueDaysOffset: 0, priority: "high" },
      { title: "Confirm decision timeline", dueDaysOffset: 0, priority: "high" },
      { title: "Confirm what they need to say yes", dueDaysOffset: 1, priority: "high" },
      { title: "Offer samples", dueDaysOffset: 2, priority: "medium" },
      { title: "End meeting with one next action and date", dueDaysOffset: 0, priority: "high" },
    ],
    enforcementWarnings: [
      "Cannot advance without a decision timeline confirmed.",
      "Leaving meetings without a next step hands the deal to entropy.",
    ],
  },
  {
    crmStages: ["samples_sent", "vendor_setup", "authorization_pending"],
    growthOpsStage: "Partner",
    goal: "Samples, vendor setup, and authorization.",
    tasks: [
      { title: "Send samples with tracking", dueDaysOffset: 0, priority: "high" },
      { title: "Create sample follow-up task (5 business days)", dueDaysOffset: 5, priority: "high" },
      { title: "Start vendor setup checklist", dueDaysOffset: 0, priority: "high" },
      { title: "Confirm distribution requirements", dueDaysOffset: 1, priority: "medium" },
      { title: "Confirm pricing, case packs, and margin", dueDaysOffset: 2, priority: "medium" },
    ],
    enforcementWarnings: [
      "Cannot advance without samples sent or vendor setup started.",
      "Speed wins. Retail buyers forget you fast.",
    ],
  },
];

export function getPlaybookForStage(crmStage: string): StagePlaybookConfig | null {
  return STAGE_PLAYBOOKS.find((p) => p.crmStages.includes(crmStage)) ?? null;
}

// ---------------------------------------------------------------------------
// Stage Enforcement
// ---------------------------------------------------------------------------

export function getStageEnforcementWarnings(opp: Opportunity): string[] {
  const warnings: string[] = [];
  if (!opp.next_step_date) {
    warnings.push("Set a next step date before advancing — every opportunity needs one.");
  }
  // Interested: need decision timeline
  if (
    ["pitch_delivered", "follow_up"].includes(opp.stage) &&
    !opp.next_step_description?.toLowerCase().includes("timeline")
  ) {
    warnings.push("Confirm decision timeline before marking Interested.");
  }
  // Partner: need samples evidence
  if (["samples_sent", "vendor_setup", "authorization_pending"].includes(opp.stage)) {
    const hasSamples = opp.activities?.some(
      (a) => a.title?.toLowerCase().includes("sample") || a.description?.toLowerCase().includes("sample")
    );
    if (!hasSamples) {
      warnings.push("Log sample shipment activity before advancing to Partner.");
    }
  }
  return warnings;
}

// ---------------------------------------------------------------------------
// Stalled Deal Wizard Steps
// ---------------------------------------------------------------------------

export interface StalledWizardStep {
  number: number;
  title: string;
  description: string;
  actionType: "verify" | "task" | "email" | "stage_change";
}

export const STALLED_WIZARD_STEPS: StalledWizardStep[] = [
  { number: 1, title: "Confirm buyer is correct person", description: "Check contacts — is this the right decision maker?", actionType: "verify" },
  { number: 2, title: "Confirm last message had a clear ask", description: "Review your last outreach — did it end with a specific ask and time window?", actionType: "verify" },
  { number: 3, title: "Call and leave a voicemail", description: "Create a call task for today. Leave a voicemail referencing your email.", actionType: "task" },
  { number: 4, title: "Loop in assistant buyer", description: "Find the assistant buyer contact and send a CC version of your email.", actionType: "email" },
  { number: 5, title: "Send a short update with a reason to respond", description: "Use AI to generate a 'reason to respond' email based on the opportunity context.", actionType: "email" },
  { number: 6, title: "Offer samples or a quick category fit call", description: "Insert a sample offer line and suggest two time windows for a brief call.", actionType: "email" },
  { number: 7, title: "Mark as cold and move on", description: "No response after all steps. Move to Cold stage and schedule a 'revisit in 60 days' task.", actionType: "stage_change" },
];

// ---------------------------------------------------------------------------
// Weekly Metrics Config
// ---------------------------------------------------------------------------

export interface WeeklyMetricConfig {
  key: string;
  label: string;
  description: string;
  icon: string;
}

export const WEEKLY_METRICS_CONFIG: WeeklyMetricConfig[] = [
  { key: "meetings_booked", label: "Meetings Booked", description: "Opps at meeting_booked stage", icon: "\u{1F4C5}" },
  { key: "pitches_delivered", label: "Pitches Delivered", description: "Opps at pitch_delivered stage", icon: "\u{1F3AF}" },
  { key: "samples_sent", label: "Samples Sent", description: "Opps at samples_sent stage", icon: "\u{1F4E6}" },
  { key: "vendor_setups", label: "Vendor Setups", description: "Opps at vendor_setup stage", icon: "\u{1F527}" },
  { key: "authorizations", label: "Authorizations", description: "Opps at authorization_pending stage", icon: "\u2705" },
  { key: "first_pos", label: "First POs", description: "Opps at po_received stage", icon: "\u{1F4B0}" },
  { key: "reorders", label: "Reorders", description: "Opps at reorder_cycle stage", icon: "\u{1F504}" },
  { key: "stalled_14", label: "Stalled 14+ Days", description: "Deals with no activity for 14+ days", icon: "\u26A0\uFE0F" },
  { key: "missing_next_step", label: "Missing Next Step", description: "Active opps without a next step date", icon: "\u{1F6A8}" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

export function futureDateISO(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split("T")[0];
}

export function getRunBlockStorageKey(): string {
  return `growth-ops-run-${todayISO()}`;
}

export function getCompletedBlocks(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(getRunBlockStorageKey()) || "[]");
  } catch {
    return [];
  }
}

export function markBlockCompleted(blockId: string): void {
  const completed = getCompletedBlocks();
  if (!completed.includes(blockId)) {
    completed.push(blockId);
    localStorage.setItem(getRunBlockStorageKey(), JSON.stringify(completed));
  }
}
