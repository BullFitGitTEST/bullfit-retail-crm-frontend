// =============================================================================
// Data Health — TypeScript Types
// =============================================================================

export type HealthSeverity = "critical" | "warning" | "info";

export type HealthCategory =
  | "missing_procurement"
  | "unknown_sales"
  | "missing_opp_lines"
  | "missing_po_costs"
  | "forecast_variance";

export interface HealthIssue {
  category: HealthCategory;
  severity: HealthSeverity;
  title: string;
  description: string;
  count: number;
  details: HealthIssueDetail[];
}

export interface HealthIssueDetail {
  /** Primary identifier (SKU, PO number, opp name, etc.) */
  label: string;
  /** Optional secondary info */
  sublabel?: string;
  /** Link to fix the issue */
  href?: string;
}

export interface DataHealthSummary {
  total_issues: number;
  critical_count: number;
  warning_count: number;
  info_count: number;
  checks: HealthIssue[];
  checked_at: string;
}
