# BullFit Retail CRM — Frontend

## Project Overview
Retail CRM for BullFit (supplement brand). Manages retail accounts, prospects, contacts, opportunities, pipeline, sequences, tasks, calls, orders, and reporting. Dark-themed UI (slate/indigo).

## Tech Stack
- **Framework:** Next.js 16.1.6 (App Router, Turbopack)
- **React:** 19.2.3
- **TypeScript:** 5
- **Styling:** Tailwind CSS v4
- **CSV Parsing:** PapaParse
- **Drag & Drop:** @dnd-kit
- **Auth:** Supabase Auth (`src/lib/supabase.ts`)

## URLs & Environments
- **Production:** https://retail.bullfit.com
- **Vercel Project:** `bullfit-retail-crm-frontend` under `harrison-9935s-projects`
- **Backend API:** Set via `NEXT_PUBLIC_API_URL` (production: `https://bullfit-api-production.up.railway.app`)
- **Supabase:** `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Git & Deploy
- **Repo:** `BullFitGitTEST/bullfit-retail-crm-frontend` on GitHub
- **Git email:** `harrison@bullfit.com` (MUST use this — Vercel rejects other emails)
- **Git user:** `Harrison`
- **GitHub CLI account:** Switch to `BullFitGitTEST` before pushing (`gh auth switch --user BullFitGitTEST`)
- **Deploy:** `vercel --prod --yes` from project root (or auto-deploys on push)
- **Build:** `npm run build` (uses `next build`)

## Routes (14 pages, 3 API routes)
| Route | Purpose |
|-------|---------|
| `/` | Dashboard |
| `/accounts` | Account list + CSV import |
| `/accounts/[id]` | Account detail (contacts, locations, opportunities, notes) |
| `/prospects` | Prospect list + CSV import |
| `/prospects/[id]` | Prospect detail |
| `/pipeline` | Kanban board for opportunities |
| `/opportunities/[id]` | Opportunity detail |
| `/sequences` | Email sequences list |
| `/sequences/[id]` | Sequence detail |
| `/tasks` | Task management |
| `/calls` | Call log |
| `/customers` | Customer list |
| `/orders` | Order list |
| `/reporting` | Reports & analytics |
| `/api/apollo/search` | Apollo.io people search proxy |
| `/api/apollo/reveal` | Apollo.io contact reveal proxy |
| `/api/apollo/outreach` | Apollo.io outreach proxy |

## Key Files
| File | Purpose |
|------|---------|
| `src/lib/api.ts` | All backend API calls (100+ functions) — accounts, contacts, opportunities, locations, activities, templates, sequences, AI |
| `src/lib/supabase.ts` | Supabase client & auth helpers |
| `src/lib/csv.ts` | CSV parsing, column mapping, normalization, dedup (prospects + accounts) |
| `src/lib/csv-constants.ts` | Column aliases, mappable fields, US state map |
| `src/components/Navbar.tsx` | Main navigation sidebar |
| `src/components/HelpPanel.tsx` | Contextual help tooltips |
| `src/components/AIAssistPanel.tsx` | AI features (post-meeting recap, call summary, next steps) |
| `src/components/prospects/CSVImportWizard.tsx` | 5-step prospect CSV import |
| `src/components/accounts/AccountCSVImportWizard.tsx` | 4-step account CSV import |
| `src/components/pipeline/KanbanColumn.tsx` | Pipeline drag-drop columns |

## Conventions
- All pages are `"use client"` React components
- Dark theme: `bg-slate-900` body, `bg-slate-800` cards, `border-slate-700`, `text-white` headings, `text-slate-400` secondary text
- Accent color: indigo (`bg-indigo-600`, `text-indigo-400`)
- Modals: fixed overlay with `bg-black/60 backdrop-blur-sm`, centered card with `bg-slate-800`
- Tables: desktop table hidden on mobile (`hidden md:block`), mobile card layout (`md:hidden`)
- API calls go through `src/lib/api.ts` helper functions (never direct fetch in components)
- CSV imports follow wizard pattern: Upload -> Map Columns -> Dedup -> Import

## DO NOT
- Use `hello@intakedesk.ai` for git commits — always `harrison@bullfit.com`
- Push with `IntakeDeskAI` GitHub account — always switch to `BullFitGitTEST`
- Reference or mix with the marketing engine (`/Users/cheesedog/bullfit-marketing`) — this session is RETAIL CRM only
