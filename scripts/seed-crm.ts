/**
 * Seed script for BullFit Retail CRM
 *
 * Creates realistic opportunities, tasks, and activities across all 3 accounts
 * so the Pipeline, Dashboard, Tasks, and Growth Ops pages have data to display.
 *
 * Usage: npx tsx scripts/seed-crm.ts
 */

const API_URL = "https://bullfit-api-production.up.railway.app";

// ---- helpers ----------------------------------------------------------------

async function post<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST ${path} failed ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

async function patch<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PATCH ${path} failed ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

async function put<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PUT ${path} failed ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

function daysFromNow(d: number): string {
  const date = new Date();
  date.setDate(date.getDate() + d);
  return date.toISOString().split("T")[0];
}

function daysAgo(d: number): string {
  return daysFromNow(-d);
}

// ---- accounts ---------------------------------------------------------------

const ACCOUNTS = {
  gnc: "8b535ef5-fca4-443f-8377-86706e08da74",
  fiveStar: "1f8bee23-6d0a-4f2f-8b7a-eb929ca3e2ad",
  vitaminShoppe: "2192ede7-36ab-4d46-b6aa-a36264f07b7f",
};

// ---- opportunity definitions ------------------------------------------------

interface OppDef {
  account_id: string;
  title: string;
  stage: string;
  opportunity_type: string;
  estimated_value: number;
  estimated_monthly_volume: number;
  expected_close_date: string;
  next_step_date: string | null;
  next_step_description: string | null;
  notes: string;
  source: string;
  activities: { type: string; title: string; description?: string }[];
  products: { product_name: string; sku: string; quantity: number; unit_price: number; wholesale_price: number; msrp: number; case_pack: number }[];
  tasks: { title: string; description: string; priority: string; due_date: string }[];
}

const OPPORTUNITIES: OppDef[] = [
  // ── GNC — Hot deal, deep in pipeline ─────────────────────────────────
  {
    account_id: ACCOUNTS.gnc,
    title: "GNC Times Square — BullFit Whey Launch",
    stage: "vendor_setup",
    opportunity_type: "new_authorization",
    estimated_value: 24000,
    estimated_monthly_volume: 4000,
    expected_close_date: daysFromNow(14),
    next_step_date: daysFromNow(2),
    next_step_description: "Submit completed vendor application + W-9",
    notes: "Regional buyer (Sarah Chen) approved the line. Need vendor paperwork to finalize.",
    source: "outbound",
    activities: [
      { type: "note", title: "Identified GNC Times Square as target", description: "High foot traffic location, strong supplement section." },
      { type: "call", title: "Outbound call — connected", description: "Spoke with Sarah Chen (Regional Buyer). She's interested in BullFit Whey 5lb and Pre-Workout." },
      { type: "meeting", title: "Meeting: Product pitch at GNC HQ", description: "Presented full BullFit line. Sarah wants to trial 3 SKUs. Needs samples before vendor setup." },
      { type: "email", title: "Email: Sent sample tracking info", description: "Shipped 3 sample packs via FedEx. Tracking sent to Sarah." },
      { type: "note", title: "Samples approved", description: "Sarah confirmed samples passed internal review. Moving to vendor setup." },
      { type: "stage_change", title: "Stage changed to Vendor Setup" },
    ],
    products: [
      { product_name: "BullFit Whey Protein 5lb — Chocolate", sku: "BF-WP5-CHOC", quantity: 48, unit_price: 32, wholesale_price: 32, msrp: 54.99, case_pack: 6 },
      { product_name: "BullFit Pre-Workout — Blue Razz", sku: "BF-PW-BLUE", quantity: 36, unit_price: 22, wholesale_price: 22, msrp: 39.99, case_pack: 12 },
      { product_name: "BullFit BCAA Recovery — Mango", sku: "BF-BCAA-MNG", quantity: 24, unit_price: 18, wholesale_price: 18, msrp: 32.99, case_pack: 12 },
    ],
    tasks: [
      { title: "Submit GNC vendor application", description: "Complete vendor form and attach W-9, insurance cert, price list", priority: "high", due_date: daysFromNow(2) },
      { title: "Follow up with Sarah Chen on vendor approval", description: "Check if GNC vendor ops received paperwork", priority: "medium", due_date: daysFromNow(5) },
    ],
  },

  // ── GNC — Early stage cold outreach ──────────────────────────────────
  {
    account_id: ACCOUNTS.gnc,
    title: "GNC Chicago Region — Distribution Expansion",
    stage: "first_touch",
    opportunity_type: "new_authorization",
    estimated_value: 18000,
    estimated_monthly_volume: 3000,
    expected_close_date: daysFromNow(60),
    next_step_date: daysFromNow(1),
    next_step_description: "Send intro email to regional buyer Mike Torres",
    notes: "Leveraging GNC Times Square relationship to expand into Chicago.",
    source: "referral",
    activities: [
      { type: "note", title: "Research completed on Chicago region", description: "12 GNC locations in metro Chicago. Mike Torres is regional buyer per Apollo." },
      { type: "email", title: "Email: Intro email sent to Mike Torres", description: "Sent via cold outreach cadence. Referenced Sarah Chen / Times Square deal." },
    ],
    products: [],
    tasks: [
      { title: "Call Mike Torres — GNC Chicago", description: "Follow up on intro email. Mention Sarah Chen at Times Square as reference.", priority: "high", due_date: daysFromNow(1) },
      { title: "Prep GNC Chicago pitch deck", description: "Customize deck with Chicago market data and Times Square sell-through metrics", priority: "medium", due_date: daysFromNow(3) },
    ],
  },

  // ── 5 Star Nutrition — Mid-pipeline with samples ─────────────────────
  {
    account_id: ACCOUNTS.fiveStar,
    title: "5 Star Nutrition — Texas Regional Launch",
    stage: "samples_sent",
    opportunity_type: "new_authorization",
    estimated_value: 15000,
    estimated_monthly_volume: 2500,
    expected_close_date: daysFromNow(30),
    next_step_date: daysFromNow(3),
    next_step_description: "Follow up on sample feedback from buyer",
    notes: "Owner-operated chain, 8 locations in Texas. Buyer is the owner, Jake Martinez.",
    source: "outbound",
    activities: [
      { type: "call", title: "Outbound call — connected", description: "Spoke with Jake Martinez (Owner/Buyer). He runs all purchasing decisions personally." },
      { type: "meeting", title: "Meeting: Video pitch with Jake", description: "30-min Zoom. Jake liked the Whey and Pre-Workout pricing. Wants samples before committing." },
      { type: "email", title: "Email: Post-meeting recap sent", description: "Sent recap with pricing, margin breakdown, and sample request form." },
      { type: "note", title: "Samples shipped", description: "2 cases of Whey Protein + 1 case Pre-Workout sent to Jake's flagship store in Austin." },
    ],
    products: [
      { product_name: "BullFit Whey Protein 5lb — Vanilla", sku: "BF-WP5-VAN", quantity: 40, unit_price: 30, wholesale_price: 30, msrp: 54.99, case_pack: 6 },
      { product_name: "BullFit Pre-Workout — Fruit Punch", sku: "BF-PW-FRUIT", quantity: 24, unit_price: 20, wholesale_price: 20, msrp: 39.99, case_pack: 12 },
    ],
    tasks: [
      { title: "Call Jake Martinez — sample feedback", description: "Check if Jake tried the samples and get his feedback. Push for initial PO.", priority: "high", due_date: daysFromNow(3) },
      { title: "Send 5 Star Nutrition margin calculator", description: "Custom spreadsheet showing per-unit margin at their retail price points", priority: "low", due_date: daysFromNow(5) },
    ],
  },

  // ── 5 Star Nutrition — Stalled deal (triggers wizard) ────────────────
  {
    account_id: ACCOUNTS.fiveStar,
    title: "5 Star Nutrition — BCAA Add-On",
    stage: "follow_up",
    opportunity_type: "new_authorization",
    estimated_value: 6000,
    estimated_monthly_volume: 1000,
    expected_close_date: daysAgo(5),
    next_step_date: daysAgo(18),
    next_step_description: "Follow up on BCAA pricing discussion",
    notes: "Jake was interested in adding BCAAs but went quiet after initial discussion.",
    source: "upsell",
    activities: [
      { type: "call", title: "Outbound call — connected", description: "Jake interested in BCAA line for 3 locations. Asked for volume pricing." },
      { type: "email", title: "Email: Sent BCAA volume pricing", description: "Sent tiered pricing for 3-store vs 8-store order quantities." },
      { type: "call", title: "Outbound call — voicemail", description: "Left voicemail following up on pricing email. No response." },
    ],
    products: [
      { product_name: "BullFit BCAA Recovery — Mango", sku: "BF-BCAA-MNG", quantity: 36, unit_price: 16, wholesale_price: 16, msrp: 32.99, case_pack: 12 },
    ],
    tasks: [
      { title: "Re-engage Jake on BCAA add-on", description: "Deal stalled 18 days. Try calling at different time or reaching assistant buyer.", priority: "high", due_date: daysAgo(4) },
    ],
  },

  // ── Vitamin Shoppe — Meeting booked ──────────────────────────────────
  {
    account_id: ACCOUNTS.vitaminShoppe,
    title: "Vitamin Shoppe — National Authorization",
    stage: "meeting_booked",
    opportunity_type: "new_authorization",
    estimated_value: 120000,
    estimated_monthly_volume: 20000,
    expected_close_date: daysFromNow(90),
    next_step_date: daysFromNow(4),
    next_step_description: "Product pitch meeting with category manager",
    notes: "Big fish. National chain with 700+ locations. Category manager (Lisa Park) agreed to meeting after seeing BullFit at Arnold Classic.",
    source: "trade_show",
    activities: [
      { type: "note", title: "Trade show contact — Arnold Classic", description: "Lisa Park (Category Manager) stopped at BullFit booth. Exchanged cards, expressed interest in Whey line." },
      { type: "email", title: "Email: Follow-up from Arnold Classic", description: "Sent intro email with product catalog, margin sheet, and meeting request." },
      { type: "email", title: "Email: Meeting confirmed", description: "Lisa confirmed March 2 for a 45-min product pitch via Zoom." },
    ],
    products: [],
    tasks: [
      { title: "Prep Vitamin Shoppe pitch deck", description: "Customize for national chain: include competitor shelf data, margin analysis, promo calendar", priority: "high", due_date: daysFromNow(2) },
      { title: "Research Vitamin Shoppe vendor requirements", description: "Check if they require EDI, specific insurance minimums, or planogram specs", priority: "medium", due_date: daysFromNow(3) },
      { title: "Prepare sample kits for Vitamin Shoppe", description: "3 sample kits: Whey (Choc, Van, Straw), Pre-Workout, BCAA for Lisa's team", priority: "medium", due_date: daysFromNow(4) },
    ],
  },

  // ── Vitamin Shoppe — Early prospecting ───────────────────────────────
  {
    account_id: ACCOUNTS.vitaminShoppe,
    title: "Vitamin Shoppe Houston — Local Pilot",
    stage: "contact_found",
    opportunity_type: "new_authorization",
    estimated_value: 8000,
    estimated_monthly_volume: 1200,
    expected_close_date: daysFromNow(45),
    next_step_date: daysFromNow(1),
    next_step_description: "Send intro email to store manager",
    notes: "Targeting individual Houston-area stores as local pilot while national auth is in progress.",
    source: "outbound",
    activities: [
      { type: "note", title: "Found store manager contact", description: "Apollo revealed David Kim as Houston Galleria location manager. Direct phone and email." },
    ],
    products: [],
    tasks: [
      { title: "Email David Kim — Vitamin Shoppe Houston", description: "Send buyer intro email. Mention the national authorization conversation as social proof.", priority: "medium", due_date: daysFromNow(1) },
    ],
  },

  // ── GNC — Won deal (on shelf) ────────────────────────────────────────
  {
    account_id: ACCOUNTS.gnc,
    title: "GNC Miami Beach — Initial Order",
    stage: "on_shelf",
    opportunity_type: "new_authorization",
    estimated_value: 9600,
    estimated_monthly_volume: 1600,
    expected_close_date: daysAgo(10),
    next_step_date: daysFromNow(14),
    next_step_description: "Check sell-through rate and reorder timing",
    notes: "First BullFit placement at GNC. 2 SKUs on shelf since Feb 15. Strong early velocity.",
    source: "outbound",
    activities: [
      { type: "note", title: "Product on shelf", description: "BullFit Whey Chocolate and Pre-Workout Blue Razz placed on shelf at GNC Miami Beach." },
      { type: "stage_change", title: "Stage changed to On Shelf" },
      { type: "note", title: "Week 1 sell-through update", description: "Store manager reports 8 units of Whey and 5 units Pre-Workout sold in first week. Above average for new brands." },
    ],
    products: [
      { product_name: "BullFit Whey Protein 5lb — Chocolate", sku: "BF-WP5-CHOC", quantity: 24, unit_price: 32, wholesale_price: 32, msrp: 54.99, case_pack: 6 },
      { product_name: "BullFit Pre-Workout — Blue Razz", sku: "BF-PW-BLUE", quantity: 24, unit_price: 22, wholesale_price: 22, msrp: 39.99, case_pack: 12 },
    ],
    tasks: [
      { title: "Check GNC Miami sell-through data", description: "Get 30-day sell-through report from store. Prepare reorder recommendation.", priority: "medium", due_date: daysFromNow(14) },
    ],
  },

  // ── 5 Star Nutrition — Lost deal ─────────────────────────────────────
  {
    account_id: ACCOUNTS.fiveStar,
    title: "5 Star Nutrition — Creatine Line",
    stage: "closed_lost",
    opportunity_type: "new_authorization",
    estimated_value: 4500,
    estimated_monthly_volume: 750,
    expected_close_date: daysAgo(20),
    next_step_date: null,
    next_step_description: null,
    notes: "Jake passed on creatine — already has exclusive deal with another brand.",
    source: "upsell",
    activities: [
      { type: "call", title: "Outbound call — connected", description: "Pitched BullFit Creatine Monohydrate. Jake said he has exclusive deal with Nutrabio for creatine category." },
      { type: "note", title: "Deal lost — exclusive competitor contract", description: "Jake's Nutrabio creatine contract runs through end of year. Revisit in Q1 2027." },
    ],
    products: [
      { product_name: "BullFit Creatine Monohydrate 300g", sku: "BF-CRE-300", quantity: 24, unit_price: 14, wholesale_price: 14, msrp: 24.99, case_pack: 12 },
    ],
    tasks: [],
  },
];

// ---- main -------------------------------------------------------------------

async function seed() {
  console.log("🌱 BullFit CRM Seed Script");
  console.log("===========================\n");

  for (const oppDef of OPPORTUNITIES) {
    console.log(`\n📦 Creating: ${oppDef.title}`);

    // 1. Create opportunity at initial stage (targeted) so we can add stuff
    const opp: any = await post("/api/opportunities", {
      account_id: oppDef.account_id,
      title: oppDef.title,
      opportunity_type: oppDef.opportunity_type,
      estimated_value: oppDef.estimated_value,
      estimated_monthly_volume: oppDef.estimated_monthly_volume,
      expected_close_date: oppDef.expected_close_date,
      next_step_date: oppDef.next_step_date,
      next_step_description: oppDef.next_step_description,
      notes: oppDef.notes,
      source: oppDef.source,
    });
    console.log(`   ✅ Created (${opp.id})`);

    // 2. Add products
    for (const prod of oppDef.products) {
      try {
        await post(`/api/opportunities/${opp.id}/products`, prod);
        console.log(`   📦 Product: ${prod.product_name}`);
      } catch (err: any) {
        console.log(`   ⚠️  Product failed: ${err.message}`);
      }
    }

    // 3. Add activities
    for (const act of oppDef.activities) {
      try {
        await post(`/api/opportunities/${opp.id}/activities`, {
          type: act.type,
          title: act.title,
          description: act.description,
        });
        console.log(`   📝 Activity: ${act.title}`);
      } catch (err: any) {
        console.log(`   ⚠️  Activity failed: ${err.message}`);
      }
    }

    // 4. Move to target stage (force through gates)
    if (oppDef.stage !== "targeted") {
      try {
        await patch(`/api/opportunities/${opp.id}/stage`, {
          stage: oppDef.stage,
          force: true,
          ...(oppDef.stage === "closed_lost"
            ? { lost_reason: oppDef.notes }
            : {}),
        });
        console.log(`   🎯 Moved to stage: ${oppDef.stage}`);
      } catch (err: any) {
        console.log(`   ⚠️  Stage move failed: ${err.message}`);
      }
    }

    // 5. Create tasks
    for (const task of oppDef.tasks) {
      try {
        await post("/api/tasks", {
          title: task.title,
          description: `${task.description}\n\nOpportunity: ${oppDef.title}`,
          priority: task.priority,
          due_date: task.due_date,
        });
        console.log(`   ✅ Task: ${task.title}`);
      } catch (err: any) {
        console.log(`   ⚠️  Task failed: ${err.message}`);
      }
    }
  }

  // ---- Summary ----
  console.log("\n\n===========================");
  console.log("🎉 Seed complete!\n");

  const opps = await fetch(`${API_URL}/api/opportunities`).then((r) => r.json());
  const tasks = await fetch(`${API_URL}/api/tasks`).then((r) => r.json());
  const dash = await fetch(`${API_URL}/api/dashboard`).then((r) => r.json());

  console.log(`  Opportunities: ${opps.length}`);
  console.log(`  Tasks:         ${tasks.length}`);
  console.log(`  Pipeline value: $${dash.pipeline_summary?.total_value?.toLocaleString() ?? 0}`);
  console.log(`  Weighted value: $${dash.pipeline_summary?.weighted_value?.toLocaleString() ?? 0}`);
  console.log("");
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
