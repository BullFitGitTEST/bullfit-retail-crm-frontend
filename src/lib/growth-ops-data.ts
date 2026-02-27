// ---------------------------------------------------------------------------
// Growth Ops Playbook — All content as typed constants
// ---------------------------------------------------------------------------

export interface PlaybookRule {
  number: number;
  text: string;
}

export interface ChecklistItem {
  text: string;
}

export interface DailyBlock {
  id: string;
  label: string;
  color: "emerald" | "amber" | "indigo";
  items: ChecklistItem[];
}

export interface StageGuide {
  id: string;
  stage: string;
  color: "emerald" | "amber" | "indigo" | "purple";
  goal: string;
  doThis: string[];
  insight: string;
  insightLabel: string;
  insightType: "wins" | "kills";
}

export interface OutreachStep {
  label: string;
  timing: string;
  instructions: string;
}

export interface CloseRateSection {
  title: string;
  items: string[];
  callout?: string;
}

export interface StalledStep {
  number: number;
  action: string;
}

export interface PlaybookSection {
  id: string;
  title: string;
  icon: string;
  description: string;
}

// ---------------------------------------------------------------------------
// Intro
// ---------------------------------------------------------------------------

export const PLAYBOOK_INTRO =
  "Growth Ops is the playbook section. It exists to help you move deals forward, get authorized, get on shelf, and drive reorders. Use it daily. This is where BullFit wins doors.";

export const PLAYBOOK_PURPOSE = [
  "Turn outreach into meetings",
  "Turn meetings into authorization",
  "Turn authorization into first PO",
  "Turn first PO into reorders and door expansion",
  "Prevent deals from stalling or dying quietly",
];

// ---------------------------------------------------------------------------
// The Rules
// ---------------------------------------------------------------------------

export const PLAYBOOK_RULES: PlaybookRule[] = [
  { number: 1, text: "If it is not in the CRM, it did not happen" },
  { number: 2, text: "Every opportunity must have a next step and a next step date" },
  { number: 3, text: "Every message must end with a clear ask and a time window" },
  { number: 4, text: "Stalled deals get fixed first, new deals second" },
  { number: 5, text: "You do not move stages because you feel good. You move stages because the real world step happened" },
];

// ---------------------------------------------------------------------------
// Daily Operating Rhythm
// ---------------------------------------------------------------------------

export const DAILY_RHYTHM: DailyBlock[] = [
  {
    id: "morning",
    label: "Morning",
    color: "emerald",
    items: [
      { text: "Open Dashboard" },
      { text: "Clear overdue Tasks" },
      { text: 'Open Pipeline and filter for "No next step date" and "Stalled 14+ days"' },
      { text: "Fix next steps and schedule follow ups" },
      { text: "Add at least 5 new Prospects if your pipeline is thin" },
    ],
  },
  {
    id: "midday",
    label: "Midday",
    color: "amber",
    items: [
      { text: "Do outreach blocks" },
      { text: "Log Calls" },
      { text: "Update the Opportunity stage only after the action is complete" },
      { text: "Create tasks for every follow up" },
    ],
  },
  {
    id: "eod",
    label: "End of Day",
    color: "indigo",
    items: [
      { text: "Close out tasks or reschedule with a reason" },
      { text: "Make sure every active opportunity has next step date" },
      { text: "Identify the top 3 deals you will advance tomorrow" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Stage Playbook
// ---------------------------------------------------------------------------

export const STAGE_GUIDES: StageGuide[] = [
  {
    id: "lead",
    stage: "Lead",
    color: "emerald",
    goal: "Find the right buyer and get a meeting.",
    doThis: [
      "Confirm retailer fit",
      "Identify buyer and assistant buyer",
      "Send intro email with a single ask",
      "Follow up within 48 hours",
      "Call if no response by day 4",
    ],
    insightLabel: "Close the gap",
    insight:
      "If you do not have a buyer name and contact method, you do not have a lead. You have a logo.",
    insightType: "kills",
  },
  {
    id: "contacted",
    stage: "Contacted",
    color: "amber",
    goal: "Get a meeting on the calendar.",
    doThis: [
      "Send a short intro with 3 bullets",
      "Include one clear ask: 15 minute buyer call next week",
      "Include 2 time windows",
      "Attach a one pager only if asked",
      "Follow up 3 times over 10 days",
    ],
    insightLabel: "What wins",
    insight:
      'Specificity. You are not asking "what do you think." You are asking for a meeting with a reason.',
    insightType: "wins",
  },
  {
    id: "interested",
    stage: "Interested",
    color: "indigo",
    goal: "Deliver a pitch and get commitment to next step.",
    doThis: [
      "Book pitch meeting",
      "Confirm decision timeline",
      "Confirm what they need to say yes",
      "Offer samples",
      "End meeting with one next action and date",
    ],
    insightLabel: "What kills deals",
    insight:
      'Leaving meetings without a next step. If you end with "I\'ll send info" you are handing the deal to entropy.',
    insightType: "kills",
  },
  {
    id: "partner",
    stage: "Partner",
    color: "purple",
    goal: "Samples, vendor setup, and authorization.",
    doThis: [
      "Send samples with tracking",
      "Create sample follow up task for 5 business days",
      "Start vendor setup checklist immediately",
      "Confirm distribution requirements",
      "Confirm pricing, case packs, and margin",
    ],
    insightLabel: "What wins",
    insight:
      "Speed. Retail buyers forget you fast. The fastest brand is the one that gets on shelf.",
    insightType: "wins",
  },
];

// ---------------------------------------------------------------------------
// Buyer Playbook
// ---------------------------------------------------------------------------

export const BUYER_PLAYBOOK = {
  corePitch:
    "BullFit is the clean, trusted supplement brand built around consistency, taste, and a community that buys again.",
  corePitchNote: "Keep it clean. No cringe. No medical claims.",
  proofPoints: [
    "Velocity and repeat purchase behavior",
    "Differentiated packaging and brand story that stops the scroll",
    "Operational readiness, case packs, on time fulfillment, and promo support",
  ],
  proofPointsNote: "Pick three, not ten. If you do not have proof, do not make it up. Use what is true.",
  whatBuyersWant: [
    "Will this move off shelf",
    "Will this cause headaches",
    "What margin do I get",
    "What support do you provide",
    "Will you stay in stock",
    "Who else carries it",
  ],
  whatBuyersWantNote: "Every email and pitch should address at least two of these.",
};

// ---------------------------------------------------------------------------
// Outreach Cadence
// ---------------------------------------------------------------------------

export const OUTREACH_CADENCE: OutreachStep[] = [
  {
    label: "Email 1",
    timing: "Day 1",
    instructions: "Short. Three bullets. One ask. Two time windows.",
  },
  {
    label: "Email 2",
    timing: "After 48 hours",
    instructions: "Re-send with a shorter ask. Mention samples.",
  },
  {
    label: "Email 3",
    timing: "After 4 days",
    instructions:
      "Call and leave a voicemail. Send email right after referencing the call.",
  },
  {
    label: "Email 4",
    timing: "After 7–10 days",
    instructions: "Breakup email. Polite. Direct. Ends with ask.",
  },
];

export const OUTREACH_CADENCE_NOTE =
  "If you are not following a cadence, you are gambling.";

// ---------------------------------------------------------------------------
// Increase Close Rate
// ---------------------------------------------------------------------------

export const CLOSE_RATE_TIPS: CloseRateSection[] = [
  {
    title: "Always confirm the decision path",
    items: [
      "Who besides you needs to approve",
      "When is the line review",
      "What is the timeline for authorization",
      "What data do you need to say yes",
    ],
    callout: "Then put that in the CRM.",
  },
  {
    title: "Always trade value for action",
    items: [
      'If they ask for info, respond with: "Yes, and let\'s book 15 minutes so I can tailor it to your set and goals."',
    ],
    callout: "Info without a meeting is a stall tactic.",
  },
  {
    title: "Always set the next step before ending a call",
    items: ["Next step plus date plus owner."],
    callout:
      "If you cannot get a date, your opportunity is not real.",
  },
];

// ---------------------------------------------------------------------------
// Get Into More Doors
// ---------------------------------------------------------------------------

export const DOOR_EXPANSION = {
  doorMathIntro:
    "Authorization is not the finish line. Doors live on shelf.",
  doorMathMetrics: [
    "Doors authorized",
    "Doors live",
    "Doors reordering",
  ],
  doorMathNote:
    "If doors are not reordering, you have a placement problem, not a sales problem.",
  expansionPaths: [
    "Confirm launch plan",
    "Confirm merchandising",
    "Confirm promo calendar",
    "Confirm reorder window",
    "Ask for expansion doors after first reorder",
  ],
  expansionNote: "Expansion happens after proof, not before.",
};

// ---------------------------------------------------------------------------
// Stalled Deal Fix List
// ---------------------------------------------------------------------------

export const STALLED_DEAL_FIX: StalledStep[] = [
  { number: 1, action: "Confirm buyer is correct person" },
  { number: 2, action: "Confirm your last message had a clear ask" },
  { number: 3, action: "Call and leave a voicemail" },
  { number: 4, action: "Loop in assistant buyer" },
  { number: 5, action: "Send a short update with a reason to respond" },
  { number: 6, action: "Offer samples or a quick category fit call" },
  { number: 7, action: "If no response, mark as cold and move on" },
];

export const STALLED_DEAL_NOTE =
  "Do not keep dead deals in pipeline. It inflates your ego and kills focus.";

// ---------------------------------------------------------------------------
// Weekly Metrics
// ---------------------------------------------------------------------------

export const WEEKLY_METRICS: string[] = [
  "Meetings booked",
  "Pitches delivered",
  "Samples sent",
  "Vendor setups started",
  "Authorizations gained",
  "First POs received",
  "Reorders received",
  "Deals stalled 14+ days",
  "Opportunities missing next step dates",
];

export const WEEKLY_METRICS_NOTE =
  "If you track calls only, you will optimize activity instead of outcomes.";

// ---------------------------------------------------------------------------
// What Great Reps Do
// ---------------------------------------------------------------------------

export const GREAT_REPS_DO: string[] = [
  "They follow up relentlessly without being annoying",
  "They always leave a call with a next step date",
  "They log clean notes so the team can pick up the thread",
  "They move fast through samples and setup",
  "They drop dead deals quickly and fill the top of the funnel",
];

export const GREAT_REPS_CLOSING =
  "This is how you close more deals and get into more doors.";

// ---------------------------------------------------------------------------
// Section Navigation Metadata
// ---------------------------------------------------------------------------

export const PLAYBOOK_SECTIONS: PlaybookSection[] = [
  {
    id: "daily-rhythm",
    title: "Daily Rhythm",
    icon: "\u{1F4CB}",
    description: "Morning, midday, and end-of-day checklists",
  },
  {
    id: "stage-playbook",
    title: "Stage Playbook",
    icon: "\u{1F3AF}",
    description: "What to do at Lead, Contacted, Interested, Partner",
  },
  {
    id: "buyer-playbook",
    title: "Buyer Playbook",
    icon: "\u{1F4BC}",
    description: "Your pitch, proof points, and what buyers want",
  },
  {
    id: "outreach-cadence",
    title: "Outreach Cadence",
    icon: "\u{1F4E7}",
    description: "4-email sequence that books meetings",
  },
  {
    id: "close-rate",
    title: "Close Rate",
    icon: "\u{1F4C8}",
    description: "Decision path, trade value, set next steps",
  },
  {
    id: "door-expansion",
    title: "More Doors",
    icon: "\u{1F6AA}",
    description: "Door math and expansion after first PO",
  },
  {
    id: "stalled-deals",
    title: "Stalled Deals",
    icon: "\u{26A0}\u{FE0F}",
    description: "7-step fix list for deals stuck 14+ days",
  },
  {
    id: "weekly-metrics",
    title: "Weekly Metrics",
    icon: "\u{1F4CA}",
    description: "9 metrics that matter every week",
  },
  {
    id: "great-reps",
    title: "Great Reps",
    icon: "\u{1F3C6}",
    description: "What the best reps do differently",
  },
];
