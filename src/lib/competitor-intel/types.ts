// =============================================================================
// Competitor Intel — TypeScript Types
// =============================================================================

// ---------------------------------------------------------------------------
// Enums / union types
// ---------------------------------------------------------------------------

export type CompetitorPriority = "high" | "medium" | "low";

export type SourceType =
  | "website_pdp"
  | "website_collection"
  | "pricing_page"
  | "amazon_listing"
  | "instagram"
  | "tiktok"
  | "press";

export type FetchFrequency = "daily" | "weekly";

export type ExtractionStatus = "pending" | "success" | "failed";

export type RunType =
  | "snapshot_fetch"
  | "extraction"
  | "diff"
  | "insight_generation"
  | "recommendation_generation"
  | "competitor_discovery";

export type RunStatus = "success" | "failed" | "running";

export type ActionType =
  | "update_pitch"
  | "update_template"
  | "update_sequence"
  | "update_pricing_sheet"
  | "create_one_pager"
  | "add_objection_response";

export type ExpectedImpact = "high" | "medium" | "low";

// ---------------------------------------------------------------------------
// Database row types
// ---------------------------------------------------------------------------

export interface Competitor {
  id: string;
  name: string;
  tags: string[];
  priority: CompetitorPriority;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // joined / computed
  sources_count?: number;
  last_snapshot_at?: string | null;
  change_score_7d?: number;
}

export interface CompetitorSource {
  id: string;
  competitor_id: string;
  source_type: SourceType;
  url: string;
  fetch_frequency: FetchFrequency;
  is_active: boolean;
  notes: string | null;
  last_fetched_at: string | null;
  created_at: string;
}

export interface CompetitorSnapshot {
  id: string;
  competitor_id: string;
  source_id: string;
  fetched_at: string;
  http_status: number | null;
  content_hash: string | null;
  raw_html_storage_path: string | null;
  extracted_text: string | null;
  extraction_status: ExtractionStatus;
  extraction_error: string | null;
  extracted_json: ExtractedData;
  created_at: string;
  // joined
  competitor_name?: string;
  source_url?: string;
  source_type?: SourceType;
}

export interface CompetitorDiff {
  id: string;
  competitor_id: string;
  source_id: string;
  from_snapshot_id: string;
  to_snapshot_id: string;
  diff_json: DiffResult;
  severity_score: number;
  created_at: string;
  // joined
  competitor_name?: string;
  source_url?: string;
}

export interface CompetitorInsight {
  id: string;
  competitor_id: string;
  period_start: string;
  period_end: string;
  summary: string;
  opportunities: InsightItem[];
  threats: InsightItem[];
  citations: Citation[];
  created_by: string | null;
  created_at: string;
  // joined
  competitor_name?: string;
}

export interface CompetitorRecommendation {
  id: string;
  competitor_id: string;
  insight_id: string;
  period_start: string;
  period_end: string;
  recommendations: RecommendationItem[];
  created_at: string;
  // joined
  competitor_name?: string;
}

export interface CompetitorRun {
  id: string;
  run_type: RunType;
  competitor_id: string | null;
  source_id: string | null;
  started_at: string;
  finished_at: string | null;
  status: RunStatus;
  model: string | null;
  prompt_version: string | null;
  input_json: Record<string, unknown>;
  output_json: Record<string, unknown>;
  citations: Citation[];
  compliance_json: ComplianceResult;
  error: string | null;
}

// ---------------------------------------------------------------------------
// Extraction schema — the canonical shape extracted from each snapshot
// ---------------------------------------------------------------------------

export interface ExtractedPrice {
  amount: number | null;
  currency: string | null;
}

export interface ExtractedPromo {
  is_present: boolean;
  text: string | null;
}

export interface ExtractedReviews {
  count: number | null;
  rating: number | null;
}

export interface ExtractedData {
  product_name: string | null;
  price: ExtractedPrice;
  servings: number | null;
  pack_size_text: string | null;
  price_per_serving: number | null;
  promo: ExtractedPromo;
  key_messaging: string[];
  claims_phrases: string[];
  shipping_threshold: ExtractedPrice;
  reviews: ExtractedReviews;
  detected_changes_hint: string[];
}

// ---------------------------------------------------------------------------
// Diff schema
// ---------------------------------------------------------------------------

export interface ChangedField {
  field_path: string;
  from: unknown;
  to: unknown;
}

export interface DiffResult {
  changed_fields: ChangedField[];
  summary: string;
  severity_score: number;
}

// ---------------------------------------------------------------------------
// Citation
// ---------------------------------------------------------------------------

export interface Citation {
  snapshot_id: string;
  field_path: string;
}

// ---------------------------------------------------------------------------
// Insight items
// ---------------------------------------------------------------------------

export interface InsightItem {
  title: string;
  why_it_matters: string;
  citations: Citation[];
}

// ---------------------------------------------------------------------------
// Recommendation items
// ---------------------------------------------------------------------------

export interface RecommendationTaskPayload {
  title: string;
  description: string;
  due_offset_days: number;
  metadata: {
    competitor_id: string;
    insight_id: string;
    citations: Citation[];
  };
}

export interface RecommendationItem {
  title: string;
  action_type: ActionType;
  why_it_matters: string;
  expected_impact: ExpectedImpact;
  task_payload: RecommendationTaskPayload;
  citations: Citation[];
}

// ---------------------------------------------------------------------------
// Compliance
// ---------------------------------------------------------------------------

export interface ComplianceFlag {
  type: "missing_citation" | "unsupported_numeric" | "medical_claim" | "defamatory";
  message: string;
  field_path?: string;
}

export interface ComplianceResult {
  passed: boolean;
  flags: ComplianceFlag[];
}

// ---------------------------------------------------------------------------
// Input types for creating / updating
// ---------------------------------------------------------------------------

export interface CompetitorInput {
  name: string;
  tags?: string[];
  priority?: CompetitorPriority;
  is_active?: boolean;
}

export interface SourceInput {
  competitor_id: string;
  source_type: SourceType;
  url: string;
  fetch_frequency?: FetchFrequency;
  is_active?: boolean;
  notes?: string;
}

// ---------------------------------------------------------------------------
// BullFit Facts (static config type)
// ---------------------------------------------------------------------------

export interface BullFitFacts {
  brand_positioning: string[];
  operational_readiness: string[];
  allowed_claims: string[];
  product_skus: BullFitSKU[];
}

export interface BullFitSKU {
  sku: string;
  name: string;
  category: string;
  price: number;
  servings: number;
  price_per_serving: number;
  key_messaging: string[];
}

// ---------------------------------------------------------------------------
// API response wrappers
// ---------------------------------------------------------------------------

export interface CompetitorWithStats extends Competitor {
  sources_count: number;
  last_snapshot_at: string | null;
  change_score_7d: number;
}

export interface SnapshotWithDetails extends CompetitorSnapshot {
  competitor_name: string;
  source_url: string;
  source_type: SourceType;
}

export interface WeeklyRecommendationView {
  competitor_id: string;
  competitor_name: string;
  insight_id: string;
  recommendations: RecommendationItem[];
  period_start: string;
  period_end: string;
}

// ---------------------------------------------------------------------------
// AI Competitor Discovery
// ---------------------------------------------------------------------------

export interface SuggestedSource {
  url: string;
  source_type: SourceType;
  label: string;
}

export interface CompetitorSuggestion {
  name: string;
  website_url: string;
  suggested_tags: string[];
  suggested_priority: CompetitorPriority;
  reasoning: string;
  overlap_categories: string[];
  suggested_sources: SuggestedSource[];
}

export interface DiscoverCompetitorsInput {
  focus_context?: string;
  category_filter?: string[];
  exclude_names?: string[];
  max_suggestions?: number;
}

export interface DiscoverCompetitorsOutput {
  suggestions: CompetitorSuggestion[];
  market_context: string;
}
