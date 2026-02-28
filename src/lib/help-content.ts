// =============================================================================
// Contextual Help Content — keyed by route
// =============================================================================

export interface HelpSection {
  heading: string;
  items: string[];
}

export interface PageHelp {
  title: string;
  description: string;
  tips: HelpSection[];
}

const helpRegistry: Record<string, PageHelp> = {
  "/": {
    title: "Sales Dashboard",
    description:
      "Your daily command center. See pipeline health, tasks due, and key metrics at a glance.",
    tips: [
      {
        heading: "Daily Workflow",
        items: [
          "Check Tasks Due Today at the top — knock these out first",
          "Review any overdue follow-ups and reschedule or complete them",
          "Scan the Pipeline Summary to spot stalled deals",
          "Use the Action Items section for AI-suggested next steps",
        ],
      },
      {
        heading: "Key Metrics",
        items: [
          "Pipeline Value shows total revenue across all active opportunities",
          "Win Rate tracks your close ratio over the last 90 days",
          "Monthly Revenue shows closed-won deals for the current month",
        ],
      },
    ],
  },

  "/accounts": {
    title: "Accounts",
    description:
      "Each account represents one retail store, chain, or distributor. This is your customer database.",
    tips: [
      {
        heading: "Getting Started",
        items: [
          "Click '+ New Account' to add a retailer manually",
          "Use 'Import CSV' to bulk-upload accounts from a spreadsheet",
          "Search by name, city, or state to find existing accounts",
        ],
      },
      {
        heading: "Account Details",
        items: [
          "Click an account to see contacts, locations, opportunities, and notes",
          "Add contacts with the '+ Contact' button on the account detail page",
          "Link opportunities to track your sales pipeline per account",
          "Use notes for meeting recaps, preferences, and buyer intel",
        ],
      },
    ],
  },

  "/prospects": {
    title: "Prospects",
    description:
      "Prospects are potential accounts you haven't started selling to yet. Research and qualify them here.",
    tips: [
      {
        heading: "Finding Prospects",
        items: [
          "Import prospect lists via CSV — map columns in the wizard",
          "Use Apollo integration to search for retail buyers by title and location",
          "Filter by state, city, or category to focus your outreach",
        ],
      },
      {
        heading: "Working Prospects",
        items: [
          "Click a prospect to see full details and research notes",
          "Convert a qualified prospect to an Account when ready to sell",
          "Add tags to organize by region, category, or priority",
        ],
      },
    ],
  },

  "/pipeline": {
    title: "Pipeline",
    description:
      "Visual Kanban board showing all opportunities across your 14-stage sales pipeline.",
    tips: [
      {
        heading: "Using the Pipeline",
        items: [
          "Drag and drop opportunity cards between stages to update status",
          "Each column represents a pipeline stage from Targeted to Reorder Cycle",
          "Click an opportunity card to open its detail page",
          "Cards show the account name, expected value, and days in stage",
        ],
      },
      {
        heading: "Pipeline Stages",
        items: [
          "Targeted → Contact Found → First Touch → Meeting Booked",
          "Pitch Delivered → Samples Sent → Follow Up → Vendor Setup",
          "Authorization Pending → PO Received → On Shelf → Reorder Cycle",
          "Lost and Stalled are end states for deals that didn't close",
        ],
      },
    ],
  },

  "/tasks": {
    title: "Tasks",
    description:
      "Manage your to-do list. Tasks are linked to accounts, contacts, or opportunities.",
    tips: [
      {
        heading: "Task Management",
        items: [
          "Create tasks from here or from account/opportunity detail pages",
          "Set due dates to keep follow-ups on track",
          "Filter by status (open, completed, overdue) to prioritize",
          "Click a task to edit details, add notes, or change the due date",
        ],
      },
      {
        heading: "Best Practices",
        items: [
          "Start each day by reviewing overdue and due-today tasks",
          "Link every task to an account or opportunity for context",
          "Use task descriptions for call prep notes or meeting agendas",
        ],
      },
    ],
  },

  "/calls": {
    title: "Call Log",
    description:
      "Track all phone calls with retail buyers. Log outcomes and schedule follow-ups.",
    tips: [
      {
        heading: "Logging Calls",
        items: [
          "Click '+ Log Call' to record a completed call",
          "Select the account and contact for the call",
          "Choose a disposition: Connected, Voicemail, No Answer, etc.",
          "Add notes about what was discussed and next steps",
        ],
      },
      {
        heading: "Follow-up",
        items: [
          "Schedule a follow-up task directly from the call log",
          "Use the AI post-call recap feature for meeting summaries",
          "Filter by date range or account to review call history",
        ],
      },
    ],
  },

  "/reporting": {
    title: "Reports & Analytics",
    description:
      "Dashboards and reports on sales performance, pipeline health, and activity metrics.",
    tips: [
      {
        heading: "Available Reports",
        items: [
          "Pipeline Funnel: conversion rates between stages",
          "Revenue Forecast: expected close amounts by month",
          "Activity Metrics: calls, tasks, and emails per rep",
          "Account Coverage: geographic and category breakdown",
        ],
      },
      {
        heading: "Tips",
        items: [
          "Use date range filters to compare periods",
          "Export data to CSV for deeper analysis in Excel",
          "Check reports weekly to spot trends and adjust strategy",
        ],
      },
    ],
  },

  "/sequences": {
    title: "Email Sequences",
    description:
      "Automated multi-step email campaigns for prospecting and follow-up.",
    tips: [
      {
        heading: "Creating Sequences",
        items: [
          "Click '+ New Sequence' to start building a campaign",
          "Add steps with timing delays (e.g., Day 1, Day 3, Day 7)",
          "Use merge tags to personalize each email with contact/account data",
          "Preview each step before activating the sequence",
        ],
      },
      {
        heading: "Managing Sequences",
        items: [
          "Enroll contacts from the account or prospect detail page",
          "Monitor open rates and replies in the sequence detail view",
          "Pause or stop sequences for contacts who respond",
        ],
      },
    ],
  },

  "/growth-ops": {
    title: "Growth Playbook",
    description:
      "Strategic growth initiatives and action items organized by category.",
    tips: [
      {
        heading: "Using the Playbook",
        items: [
          "Review recommended growth strategies for your business",
          "Each play includes context, steps, and expected impact",
          "Mark plays as active to track progress over time",
          "Use the AI assistant to generate customized plays",
        ],
      },
    ],
  },

  "/competitor-intel": {
    title: "Competitor Intelligence",
    description:
      "Automated monitoring of competitor pricing, products, and positioning.",
    tips: [
      {
        heading: "How It Works",
        items: [
          "Add competitor URLs as monitoring sources in Settings",
          "Automated snapshots capture competitor pages on a schedule",
          "AI extracts pricing, products, and claims from each snapshot",
          "Comparisons highlight what changed between snapshots",
        ],
      },
      {
        heading: "Taking Action",
        items: [
          "Check Recommendations for AI-suggested competitive responses",
          "View Comparisons to see side-by-side snapshot diffs",
          "Create tasks directly from recommendations to act on insights",
        ],
      },
    ],
  },

  "/inventory": {
    title: "Inventory Positions",
    description:
      "Real-time inventory positions per SKU, aggregated from Shopify locations.",
    tips: [
      {
        heading: "Understanding Positions",
        items: [
          "On Hand = total units at Shopify locations marked include_in_on_hand",
          "Reserved = units held for retailer POs, quality holds, or allocations",
          "Available = On Hand minus Reserved (never goes below zero)",
          "On Order = units on open Supply POs not yet received",
        ],
      },
      {
        heading: "Alerts",
        items: [
          "Red alerts mean stockout risk — available units below safety stock",
          "Amber alerts mean low weeks-of-cover based on trailing sales velocity",
          "Click a SKU row to expand and see the per-location breakdown",
        ],
      },
    ],
  },

  "/forecast": {
    title: "Demand Forecast",
    description:
      "Blended demand model combining sales history, pipeline opportunities, and retailer POs.",
    tips: [
      {
        heading: "How the Forecast Works",
        items: [
          "Trailing Sales: last 30/60/90 days of actual Shopify sales",
          "Pipeline Demand: opportunity SKU lines weighted by stage probability",
          "Retailer POs: confirmed purchase orders from retail accounts",
          "Final demand = the maximum of all three signals (conservative)",
        ],
      },
      {
        heading: "Procurement Suggestions",
        items: [
          "Required = demand_60 + safety_stock - (available + on_order)",
          "Order quantity rounds up to the nearest case pack",
          "Suggested order date accounts for supplier lead time minus 7-day buffer",
          "Click 'Explain' on any SKU to see the full calculation breakdown",
        ],
      },
      {
        heading: "Improving Accuracy",
        items: [
          "Add SKU lines to pipeline opportunities for better pipeline demand signals",
          "Configure stage weights in Settings → Forecast to match your close rates",
          "Set safety stock and lead times in Settings → Procurement for each SKU",
        ],
      },
    ],
  },

  "/supply-pos": {
    title: "Supply Purchase Orders",
    description:
      "Create and manage POs to your manufacturers and suppliers.",
    tips: [
      {
        heading: "Creating a PO",
        items: [
          "Click '+ New PO' to start the creation wizard",
          "Step 1: Select a supplier (add suppliers first if none exist)",
          "Step 2: Add line items — use quick-add from the supplier's product catalog",
          "Set quantities, unit costs, and a requested delivery date",
        ],
      },
      {
        heading: "PO Lifecycle",
        items: [
          "Draft → Submit for Approval → Approved → Sent to Supplier → Received",
          "POs above $5,000 require manager approval (configurable in Finance Settings)",
          "POs below the threshold are auto-approved on submission",
          "Use the Cancel button to cancel a PO at any stage",
        ],
      },
      {
        heading: "Receiving",
        items: [
          "When goods arrive, record a receipt against the PO",
          "Enter the quantity received per line item (may be partial)",
          "Once all lines are fully received, the PO status flips to Received",
          "The event timeline tracks every action taken on the PO",
        ],
      },
    ],
  },

  "/ops/runs": {
    title: "Job Runs",
    description:
      "Monitor all background jobs: Shopify syncs, forecast runs, inventory snapshots, and more.",
    tips: [
      {
        heading: "Using Job Runs",
        items: [
          "Filter by module (Shopify, Forecast, Inventory) to focus on a specific system",
          "Filter by status to find failed jobs that need attention",
          "Click a job row to expand and see output, input, and error details",
          "Running jobs show duration as 'running...' until they complete",
        ],
      },
      {
        heading: "Troubleshooting",
        items: [
          "Failed jobs show the error message in the expanded detail view",
          "Check the Shopify sync jobs if product or inventory data seems stale",
          "Forecast jobs run daily at 6:00 AM — check if the latest run succeeded",
          "Use the Refresh button to see the latest job status",
        ],
      },
    ],
  },

  "/ops/data-health": {
    title: "Data Health",
    description:
      "Automated quality checks across your data. Fix issues to improve forecast accuracy and operations.",
    tips: [
      {
        heading: "Understanding Checks",
        items: [
          "Critical (red): blocking issues like missing PO costs — fix immediately",
          "Warning (amber): data gaps like missing procurement fields — fix soon",
          "Info (blue): low-priority items like forecast variance — review periodically",
        ],
      },
      {
        heading: "Common Fixes",
        items: [
          "Missing Procurement: go to Settings → Procurement and fill in case pack, MOQ, lead time",
          "Unknown SKUs: check Shopify for variants without SKU values set",
          "Missing Opp Lines: go to Forecast and link SKUs to your pipeline opportunities",
          "Zero-Cost PO Lines: click 'Fix' to open the PO and add unit costs",
        ],
      },
    ],
  },

  "/settings": {
    title: "Settings",
    description:
      "Configure feature flags, integrations, procurement parameters, and system preferences.",
    tips: [
      {
        heading: "Feature Flags",
        items: [
          "Toggle modules on/off using the switches at the top of the Settings page",
          "Disabled modules show 'Coming Soon' when users try to access them",
          "Enable modules after running the corresponding SQL migration in Supabase",
        ],
      },
      {
        heading: "Configuration Areas",
        items: [
          "Shopify: connect your store and control sync schedules",
          "Procurement: set case pack, MOQ, safety stock, and lead time per SKU",
          "Forecast: adjust pipeline stage probability weights",
          "Finance: set PO approval threshold and default payment terms",
        ],
      },
    ],
  },
};

/**
 * Get help content for a given route path.
 * Tries exact match first, then progressively shorter prefixes.
 */
export function getHelpForRoute(pathname: string): PageHelp | null {
  // Exact match
  if (helpRegistry[pathname]) return helpRegistry[pathname];

  // Prefix match for dynamic routes (e.g., /accounts/[id] → /accounts)
  const segments = pathname.split("/").filter(Boolean);
  while (segments.length > 0) {
    segments.pop();
    const prefix = "/" + segments.join("/");
    if (helpRegistry[prefix]) return helpRegistry[prefix];
  }

  return null;
}
