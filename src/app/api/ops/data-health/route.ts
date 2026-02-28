import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import type {
  HealthIssue,
  HealthIssueDetail,
  DataHealthSummary,
} from "@/lib/data-health/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const checks: HealthIssue[] = [];

    // -----------------------------------------------------------------------
    // 1. SKUs missing procurement fields
    //    Shopify variants without a matching ro_product_master row
    // -----------------------------------------------------------------------
    try {
      const { data: variants } = await supabase
        .from("ro_shopify_variants")
        .select("sku")
        .not("sku", "is", null)
        .not("sku", "eq", "");

      if (variants && variants.length > 0) {
        const skus = [...new Set(variants.map((v: { sku: string }) => v.sku))] as string[];

        const { data: masters } = await supabase
          .from("ro_product_master")
          .select("sku")
          .in("sku", skus);

        const masterSkus = new Set(
          (masters || []).map((m: { sku: string }) => m.sku)
        );
        const missing = skus.filter((s) => !masterSkus.has(s));

        if (missing.length > 0) {
          const details: HealthIssueDetail[] = missing
            .slice(0, 20)
            .map((sku) => ({
              label: sku,
              href: "/settings/procurement",
            }));

          checks.push({
            category: "missing_procurement",
            severity: "warning",
            title: "SKUs Missing Procurement Data",
            description:
              "These Shopify variant SKUs have no matching product master record. Procurement fields like lead time, MOQ, case pack, and safety stock are missing.",
            count: missing.length,
            details,
          });
        }
      }
    } catch {
      // Table may not exist yet — skip this check
    }

    // -----------------------------------------------------------------------
    // 2. UNKNOWN sales mappings
    //    ro_shopify_sales_daily rows where sku = 'UNKNOWN'
    // -----------------------------------------------------------------------
    try {
      const { count } = await supabase
        .from("ro_shopify_sales_daily")
        .select("*", { count: "exact", head: true })
        .eq("sku", "UNKNOWN");

      if (count && count > 0) {
        // Get date range
        const { data: dateRange } = await supabase
          .from("ro_shopify_sales_daily")
          .select("shop_date")
          .eq("sku", "UNKNOWN")
          .order("shop_date", { ascending: true })
          .limit(1);

        const { data: dateRangeEnd } = await supabase
          .from("ro_shopify_sales_daily")
          .select("shop_date")
          .eq("sku", "UNKNOWN")
          .order("shop_date", { ascending: false })
          .limit(1);

        const startDate = dateRange?.[0]?.shop_date || "?";
        const endDate = dateRangeEnd?.[0]?.shop_date || "?";

        checks.push({
          category: "unknown_sales",
          severity: "warning",
          title: "Unmapped Sales (UNKNOWN SKU)",
          description: `${count} daily sales records could not be mapped to a SKU. Date range: ${startDate} to ${endDate}. These orders had line items whose variant could not be resolved to a product SKU.`,
          count,
          details: [
            {
              label: `${count} records from ${startDate} to ${endDate}`,
              sublabel: "Check Shopify products for missing SKUs on variants",
            },
          ],
        });
      }
    } catch {
      // Table may not exist yet
    }

    // -----------------------------------------------------------------------
    // 3. Opportunities missing SKU lines
    //    Active opps (from existing pipeline) without ro_opportunity_sku_lines
    // -----------------------------------------------------------------------
    try {
      const { data: oppLines } = await supabase
        .from("ro_opportunity_sku_lines")
        .select("opportunity_id");

      const oppIdsWithLines = new Set(
        (oppLines || []).map(
          (o: { opportunity_id: string }) => o.opportunity_id
        )
      );

      // If there are opportunity_sku_lines entries, check if any opps are missing
      // We can't easily query the Railway API opps from here, so we check
      // if there are zero opp lines at all — that's a signal
      if (oppIdsWithLines.size === 0 && oppLines !== null) {
        checks.push({
          category: "missing_opp_lines",
          severity: "warning",
          title: "No Opportunity SKU Mappings",
          description:
            "No opportunities have been mapped to specific SKUs yet. Forecast accuracy depends on linking opportunities to expected product quantities.",
          count: 1,
          details: [
            {
              label: "Add SKU lines to active opportunities",
              sublabel: "Go to Forecast → link SKUs to pipeline opportunities",
              href: "/forecast",
            },
          ],
        });
      }
    } catch {
      // Table may not exist yet
    }

    // -----------------------------------------------------------------------
    // 4. Supply POs with missing costs
    //    ro_supply_po_line_items where unit_cost_cents IS NULL or = 0
    // -----------------------------------------------------------------------
    try {
      const { data: zeroCostLines } = await supabase
        .from("ro_supply_po_line_items")
        .select("id, sku, supply_po_id")
        .or("unit_cost_cents.is.null,unit_cost_cents.eq.0")
        .limit(50);

      if (zeroCostLines && zeroCostLines.length > 0) {
        const details: HealthIssueDetail[] = zeroCostLines
          .slice(0, 20)
          .map(
            (li: { sku: string; supply_po_id: string }) => ({
              label: li.sku || "No SKU",
              sublabel: "Missing unit cost",
              href: `/supply-pos/${li.supply_po_id}`,
            })
          );

        checks.push({
          category: "missing_po_costs",
          severity: "critical",
          title: "PO Line Items With Zero/Missing Cost",
          description:
            "These PO line items have no unit cost set. This affects total calculations, margin analysis, and inventory valuation.",
          count: zeroCostLines.length,
          details,
        });
      }
    } catch {
      // Table may not exist yet
    }

    // -----------------------------------------------------------------------
    // 5. Large forecast variance
    //    ro_forecast_accuracy where error_pct > 30
    // -----------------------------------------------------------------------
    try {
      const { data: highVariance } = await supabase
        .from("ro_forecast_accuracy")
        .select("sku, error_pct, forecasted_units, actual_units")
        .gt("error_pct", 30)
        .order("error_pct", { ascending: false })
        .limit(20);

      if (highVariance && highVariance.length > 0) {
        const details: HealthIssueDetail[] = highVariance.map(
          (row: {
            sku: string;
            error_pct: number;
            forecasted_units: number;
            actual_units: number;
          }) => ({
            label: row.sku,
            sublabel: `${Math.round(row.error_pct)}% error (forecast: ${row.forecasted_units}, actual: ${row.actual_units})`,
          })
        );

        checks.push({
          category: "forecast_variance",
          severity: "info",
          title: "High Forecast Variance (>30%)",
          description:
            "These SKUs had forecast accuracy errors exceeding 30% in the most recent accuracy check. Review demand signals and adjust inputs.",
          count: highVariance.length,
          details,
        });
      }
    } catch {
      // Table may not exist yet
    }

    // -----------------------------------------------------------------------
    // Build summary
    // -----------------------------------------------------------------------
    const criticalCount = checks.filter((c) => c.severity === "critical").length;
    const warningCount = checks.filter((c) => c.severity === "warning").length;
    const infoCount = checks.filter((c) => c.severity === "info").length;

    const summary: DataHealthSummary = {
      total_issues: checks.length,
      critical_count: criticalCount,
      warning_count: warningCount,
      info_count: infoCount,
      checks,
      checked_at: new Date().toISOString(),
    };

    return NextResponse.json(summary);
  } catch (err) {
    console.error("Data health check error:", err);
    return NextResponse.json(
      { error: "Failed to run data health checks" },
      { status: 500 }
    );
  }
}
