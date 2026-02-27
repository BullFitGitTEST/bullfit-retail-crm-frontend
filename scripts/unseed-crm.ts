/**
 * Unseed script for BullFit Retail CRM
 *
 * Deletes ONLY the opportunities and tasks created by seed-crm.ts.
 * Matches by exact title — does not touch anything else.
 *
 * Usage: npx tsx scripts/unseed-crm.ts
 */

const API_URL = "https://bullfit-api-production.up.railway.app";

// ---- Exact titles created by seed-crm.ts ------------------------------------

const SEEDED_OPPORTUNITY_TITLES = [
  "GNC Times Square — BullFit Whey Launch",
  "GNC Chicago Region — Distribution Expansion",
  "GNC Miami Beach — Initial Order",
  "5 Star Nutrition — Texas Regional Launch",
  "5 Star Nutrition — BCAA Add-On",
  "5 Star Nutrition — Creatine Line",
  "Vitamin Shoppe — National Authorization",
  "Vitamin Shoppe Houston — Local Pilot",
];

const SEEDED_TASK_TITLES = [
  "Submit GNC vendor application",
  "Follow up with Sarah Chen on vendor approval",
  "Call Mike Torres — GNC Chicago",
  "Prep GNC Chicago pitch deck",
  "Call Jake Martinez — sample feedback",
  "Send 5 Star Nutrition margin calculator",
  "Re-engage Jake on BCAA add-on",
  "Prep Vitamin Shoppe pitch deck",
  "Research Vitamin Shoppe vendor requirements",
  "Prepare sample kits for Vitamin Shoppe",
  "Email David Kim — Vitamin Shoppe Houston",
  "Check GNC Miami sell-through data",
];

// ---- helpers ----------------------------------------------------------------

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`GET ${path} failed ${res.status}`);
  return res.json() as Promise<T>;
}

async function del(path: string): Promise<void> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok && res.status !== 204) {
    const text = await res.text();
    throw new Error(`DELETE ${path} failed ${res.status}: ${text}`);
  }
}

// ---- main -------------------------------------------------------------------

async function unseed() {
  console.log("🧹 BullFit CRM Unseed Script");
  console.log("=============================\n");

  // 1. Delete seeded opportunities
  const opps: any[] = await get("/api/opportunities");
  const seededOpps = opps.filter((o) => SEEDED_OPPORTUNITY_TITLES.includes(o.title));

  console.log(`Found ${seededOpps.length} seeded opportunities (of ${opps.length} total)\n`);

  for (const opp of seededOpps) {
    try {
      await del(`/api/opportunities/${opp.id}`);
      console.log(`  ❌ Deleted opp: ${opp.title}`);
    } catch (err: any) {
      console.log(`  ⚠️  Failed to delete opp "${opp.title}": ${err.message}`);
    }
  }

  // 2. Delete seeded tasks
  const tasks: any[] = await get("/api/tasks");
  const seededTasks = tasks.filter((t) => SEEDED_TASK_TITLES.includes(t.title));

  console.log(`\nFound ${seededTasks.length} seeded tasks (of ${tasks.length} total)\n`);

  for (const task of seededTasks) {
    try {
      await del(`/api/tasks/${task.id}`);
      console.log(`  ❌ Deleted task: ${task.title}`);
    } catch (err: any) {
      console.log(`  ⚠️  Failed to delete task "${task.title}": ${err.message}`);
    }
  }

  // 3. Summary
  console.log("\n=============================");
  console.log(`🎉 Unseed complete!`);
  console.log(`   Opportunities deleted: ${seededOpps.length}`);
  console.log(`   Tasks deleted: ${seededTasks.length}`);
  console.log(`   Everything else untouched.\n`);
}

unseed().catch((err) => {
  console.error("❌ Unseed failed:", err);
  process.exit(1);
});
