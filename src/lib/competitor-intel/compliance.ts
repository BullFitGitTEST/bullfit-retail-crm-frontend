// =============================================================================
// Compliance Gate — deterministic + AI critic checks
// =============================================================================

import type {
  ComplianceFlag,
  ComplianceResult,
  Citation,
  InsightItem,
  RecommendationItem,
} from "./types";

// ---------------------------------------------------------------------------
// Blocked language patterns
// ---------------------------------------------------------------------------

const MEDICAL_DISEASE_PATTERNS = [
  /\bcures?\b/i,
  /\btreats?\b/i,
  /\bprevents?\b/i,
  /\bdiagnos(?:e|is|tic)\b/i,
  /\bdisease\b/i,
  /\bcancer\b/i,
  /\bdiabetes\b/i,
  /\bheart\s+disease\b/i,
  /\btumor\b/i,
  /\bFDA\s+approved\b/i,
  /\bclinically\s+proven\s+to\s+(?:cure|treat|prevent)\b/i,
  /\bprescription\b/i,
  /\bmedication\b/i,
];

const DEFAMATORY_PATTERNS = [
  /\bfraud(?:ulent)?\b/i,
  /\bscam\b/i,
  /\bliar\b/i,
  /\bcriminal\b/i,
  /\billegal\b/i,
  /\bcorrupt\b/i,
  /\bdangerous\s+product\b/i,
  /\bpoison(?:ous)?\b/i,
];

// ---------------------------------------------------------------------------
// Deterministic compliance checks
// ---------------------------------------------------------------------------

/**
 * Check that every insight item has at least one citation.
 */
function checkCitations(
  items: InsightItem[],
  context: string
): ComplianceFlag[] {
  const flags: ComplianceFlag[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item.citations || item.citations.length === 0) {
      flags.push({
        type: "missing_citation",
        message: `${context}[${i}] "${item.title}" has no citations.`,
        field_path: `${context}[${i}].citations`,
      });
    }
  }
  return flags;
}

/**
 * Check that recommendation items have citations.
 */
function checkRecommendationCitations(
  items: RecommendationItem[]
): ComplianceFlag[] {
  const flags: ComplianceFlag[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item.citations || item.citations.length === 0) {
      flags.push({
        type: "missing_citation",
        message: `recommendations[${i}] "${item.title}" has no citations.`,
        field_path: `recommendations[${i}].citations`,
      });
    }
  }
  return flags;
}

/**
 * Scan text for medical/disease claims.
 */
function checkMedicalLanguage(text: string, fieldPath: string): ComplianceFlag[] {
  const flags: ComplianceFlag[] = [];
  for (const pattern of MEDICAL_DISEASE_PATTERNS) {
    if (pattern.test(text)) {
      flags.push({
        type: "medical_claim",
        message: `Medical/disease language detected: "${text.match(pattern)?.[0]}" in ${fieldPath}. Flagged as risk.`,
        field_path: fieldPath,
      });
    }
  }
  return flags;
}

/**
 * Scan text for defamatory language.
 */
function checkDefamatoryLanguage(text: string, fieldPath: string): ComplianceFlag[] {
  const flags: ComplianceFlag[] = [];
  for (const pattern of DEFAMATORY_PATTERNS) {
    if (pattern.test(text)) {
      flags.push({
        type: "defamatory",
        message: `Potentially defamatory language detected: "${text.match(pattern)?.[0]}" in ${fieldPath}.`,
        field_path: fieldPath,
      });
    }
  }
  return flags;
}

/**
 * Check all text fields in insight items for prohibited language.
 */
function scanInsightItems(
  items: InsightItem[],
  context: string
): ComplianceFlag[] {
  const flags: ComplianceFlag[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const path = `${context}[${i}]`;
    flags.push(...checkMedicalLanguage(item.title, `${path}.title`));
    flags.push(...checkMedicalLanguage(item.why_it_matters, `${path}.why_it_matters`));
    flags.push(...checkDefamatoryLanguage(item.title, `${path}.title`));
    flags.push(...checkDefamatoryLanguage(item.why_it_matters, `${path}.why_it_matters`));
  }
  return flags;
}

/**
 * Check all text fields in recommendation items for prohibited language.
 */
function scanRecommendationItems(items: RecommendationItem[]): ComplianceFlag[] {
  const flags: ComplianceFlag[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const path = `recommendations[${i}]`;
    flags.push(...checkMedicalLanguage(item.title, `${path}.title`));
    flags.push(...checkMedicalLanguage(item.why_it_matters, `${path}.why_it_matters`));
    flags.push(
      ...checkMedicalLanguage(
        item.task_payload.description,
        `${path}.task_payload.description`
      )
    );
    flags.push(...checkDefamatoryLanguage(item.title, `${path}.title`));
    flags.push(...checkDefamatoryLanguage(item.why_it_matters, `${path}.why_it_matters`));
  }
  return flags;
}

/**
 * Validate that cited snapshot_ids actually exist in the provided set.
 */
function checkCitationValidity(
  citations: Citation[],
  validSnapshotIds: Set<string>,
  context: string
): ComplianceFlag[] {
  const flags: ComplianceFlag[] = [];
  for (let i = 0; i < citations.length; i++) {
    if (!validSnapshotIds.has(citations[i].snapshot_id)) {
      flags.push({
        type: "missing_citation",
        message: `${context}[${i}].snapshot_id "${citations[i].snapshot_id}" not found in valid snapshots.`,
        field_path: `${context}[${i}].snapshot_id`,
      });
    }
  }
  return flags;
}

// ---------------------------------------------------------------------------
// Public compliance gate functions
// ---------------------------------------------------------------------------

/**
 * Run compliance checks on insight generation output.
 */
export function checkInsightCompliance(
  summary: string,
  opportunities: InsightItem[],
  threats: InsightItem[],
  validSnapshotIds: Set<string>
): ComplianceResult {
  const flags: ComplianceFlag[] = [];

  // Check summary
  flags.push(...checkMedicalLanguage(summary, "summary"));
  flags.push(...checkDefamatoryLanguage(summary, "summary"));

  // Check citations exist
  flags.push(...checkCitations(opportunities, "opportunities"));
  flags.push(...checkCitations(threats, "threats"));

  // Scan for prohibited language
  flags.push(...scanInsightItems(opportunities, "opportunities"));
  flags.push(...scanInsightItems(threats, "threats"));

  // Validate citation references
  const allCitations = [
    ...opportunities.flatMap((o) => o.citations),
    ...threats.flatMap((t) => t.citations),
  ];
  flags.push(...checkCitationValidity(allCitations, validSnapshotIds, "citations"));

  return {
    passed: flags.length === 0,
    flags,
  };
}

/**
 * Run compliance checks on recommendation generation output.
 */
export function checkRecommendationCompliance(
  recommendations: RecommendationItem[],
  validSnapshotIds: Set<string>
): ComplianceResult {
  const flags: ComplianceFlag[] = [];

  // Check citations
  flags.push(...checkRecommendationCitations(recommendations));

  // Scan language
  flags.push(...scanRecommendationItems(recommendations));

  // Validate citation references
  const allCitations = recommendations.flatMap((r) => r.citations);
  flags.push(...checkCitationValidity(allCitations, validSnapshotIds, "citations"));

  return {
    passed: flags.length === 0,
    flags,
  };
}

/**
 * Quick single-text compliance scan (used by AI critic).
 */
export function quickTextScan(text: string): ComplianceFlag[] {
  return [
    ...checkMedicalLanguage(text, "text"),
    ...checkDefamatoryLanguage(text, "text"),
  ];
}
