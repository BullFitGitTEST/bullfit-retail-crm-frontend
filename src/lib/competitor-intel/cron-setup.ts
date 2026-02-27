// =============================================================================
// Cron Job Setup — Instructions and Vercel Cron configuration
// =============================================================================
//
// OPTION A: Vercel Cron (if deployed to Vercel)
// -----------------------------------------------
// Add the following to vercel.json at the project root:
//
// {
//   "crons": [
//     {
//       "path": "/api/competitor-intel/run/snapshot-fetch",
//       "schedule": "0 6 * * *"
//     },
//     {
//       "path": "/api/competitor-intel/run/extract",
//       "schedule": "30 6 * * *"
//     },
//     {
//       "path": "/api/competitor-intel/run/diff",
//       "schedule": "0 7 * * *"
//     },
//     {
//       "path": "/api/competitor-intel/run/insights-weekly",
//       "schedule": "0 7 * * 1"
//     },
//     {
//       "path": "/api/competitor-intel/run/recommendations-weekly",
//       "schedule": "30 7 * * 1"
//     }
//   ]
// }
//
// Notes:
// - Times are in UTC. Adjust for your local timezone.
// - Daily at 06:00 UTC: fetch daily sources + extract + diff
// - Weekly Monday 07:00 UTC: generate insights + recommendations
// - Vercel Cron sends a GET by default; our routes use POST.
//   You'll need to handle GET as well, or use a cron service that POSTs.
//
//
// OPTION B: Railway Cron Service
// -----------------------------------------------
// Create a Railway service with a simple script that hits the API:
//
// Daily script (run at 06:00):
//   curl -X POST https://your-app.railway.app/api/competitor-intel/run/snapshot-fetch
//   sleep 300
//   curl -X POST https://your-app.railway.app/api/competitor-intel/run/extract
//   sleep 120
//   curl -X POST https://your-app.railway.app/api/competitor-intel/run/diff
//
// Weekly script (run Monday 07:00):
//   curl -X POST https://your-app.railway.app/api/competitor-intel/run/insights-weekly
//   sleep 300
//   curl -X POST https://your-app.railway.app/api/competitor-intel/run/recommendations-weekly
//
// In Railway, set the schedule using cron expressions:
//   Daily: railway service with cron "0 6 * * *"
//   Weekly: railway service with cron "0 7 * * 1"
//
//
// OPTION C: Next.js Route Handler + External Cron (Upstash QStash, etc.)
// -----------------------------------------------
// Use Upstash QStash or similar to schedule HTTP POST calls:
//   - Daily 06:00 UTC → POST /api/competitor-intel/run/snapshot-fetch
//   - Daily 06:30 UTC → POST /api/competitor-intel/run/extract
//   - Daily 07:00 UTC → POST /api/competitor-intel/run/diff
//   - Monday 07:00 UTC → POST /api/competitor-intel/run/insights-weekly
//   - Monday 07:30 UTC → POST /api/competitor-intel/run/recommendations-weekly
//
// Protect endpoints with a CRON_SECRET env var:
//   Add to each route: if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) return 401;
//
// =============================================================================

export const CRON_SCHEDULES = {
  snapshot_fetch: "0 6 * * *",      // Daily at 06:00 UTC
  extraction: "30 6 * * *",         // Daily at 06:30 UTC
  diff: "0 7 * * *",               // Daily at 07:00 UTC
  insights_weekly: "0 7 * * 1",    // Monday at 07:00 UTC
  recommendations_weekly: "30 7 * * 1", // Monday at 07:30 UTC
} as const;

export const PIPELINE_ENDPOINTS = {
  snapshot_fetch: "/api/competitor-intel/run/snapshot-fetch",
  extraction: "/api/competitor-intel/run/extract",
  diff: "/api/competitor-intel/run/diff",
  insights_weekly: "/api/competitor-intel/run/insights-weekly",
  recommendations_weekly: "/api/competitor-intel/run/recommendations-weekly",
} as const;
