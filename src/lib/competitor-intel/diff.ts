// =============================================================================
// Diff logic — compare extracted_json between two snapshots
// =============================================================================

import type { ChangedField, DiffResult, ExtractedData } from "./types";

// Weighted severity for different field changes
const SEVERITY_WEIGHTS: Record<string, number> = {
  "price.amount": 25,
  price_per_serving: 20,
  servings: 15,
  "promo.is_present": 20,
  "promo.text": 15,
  "shipping_threshold.amount": 10,
  product_name: 5,
  pack_size_text: 5,
  "reviews.count": 3,
  "reviews.rating": 8,
  key_messaging: 10,
  claims_phrases: 15,
};

/**
 * Deep-compare two extracted data objects and produce a structured diff.
 */
export function computeDiff(
  fromData: ExtractedData,
  toData: ExtractedData
): DiffResult {
  const changedFields: ChangedField[] = [];

  // Compare scalar and nested fields
  const paths = flattenPaths(fromData as unknown as Record<string, unknown>);
  const toPaths = flattenPaths(toData as unknown as Record<string, unknown>);

  const allKeys = new Set([...Object.keys(paths), ...Object.keys(toPaths)]);

  for (const key of allKeys) {
    const fromVal = paths[key];
    const toVal = toPaths[key];

    if (!deepEqual(fromVal, toVal)) {
      changedFields.push({
        field_path: key,
        from: fromVal ?? null,
        to: toVal ?? null,
      });
    }
  }

  // Calculate severity score (0-100)
  let severity = 0;
  for (const change of changedFields) {
    const weight = findWeight(change.field_path);
    severity += weight;
  }
  severity = Math.min(100, severity);

  // Generate summary
  const summary = generateDiffSummary(changedFields);

  return {
    changed_fields: changedFields,
    summary,
    severity_score: severity,
  };
}

/**
 * Flatten a nested object into dot-notation paths.
 * Arrays are kept as values (compared as a whole).
 */
function flattenPaths(
  obj: Record<string, unknown>,
  prefix = ""
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;

    if (Array.isArray(value)) {
      // Keep arrays as-is for comparison
      result[path] = value;
    } else if (value !== null && typeof value === "object") {
      Object.assign(result, flattenPaths(value as Record<string, unknown>, path));
    } else {
      result[path] = value;
    }
  }

  return result;
}

/**
 * Find the severity weight for a field path.
 */
function findWeight(fieldPath: string): number {
  // Exact match
  if (SEVERITY_WEIGHTS[fieldPath] !== undefined) {
    return SEVERITY_WEIGHTS[fieldPath];
  }
  // Partial match (e.g., "promo.text" matches "promo")
  for (const [pattern, weight] of Object.entries(SEVERITY_WEIGHTS)) {
    if (fieldPath.startsWith(pattern) || pattern.startsWith(fieldPath)) {
      return weight;
    }
  }
  return 2; // default minor weight
}

/**
 * Generate a human-readable diff summary.
 */
function generateDiffSummary(changes: ChangedField[]): string {
  if (changes.length === 0) return "No changes detected.";

  const parts: string[] = [];

  for (const change of changes) {
    if (change.field_path === "price.amount" && change.from !== null && change.to !== null) {
      const direction = (change.to as number) > (change.from as number) ? "increased" : "decreased";
      parts.push(`Price ${direction} from $${change.from} to $${change.to}`);
    } else if (change.field_path === "promo.is_present") {
      if (change.to === true) {
        parts.push("New promotion detected");
      } else {
        parts.push("Promotion removed");
      }
    } else if (change.field_path === "servings") {
      parts.push(`Servings changed from ${change.from ?? "unknown"} to ${change.to ?? "unknown"}`);
    } else if (change.field_path === "shipping_threshold.amount") {
      parts.push(
        `Shipping threshold changed from $${change.from ?? "unknown"} to $${change.to ?? "unknown"}`
      );
    } else if (change.field_path === "key_messaging") {
      parts.push("Key messaging updated");
    } else if (change.field_path === "claims_phrases") {
      parts.push("Product claims changed");
    } else if (change.field_path === "reviews.rating") {
      parts.push(`Rating changed from ${change.from ?? "unknown"} to ${change.to ?? "unknown"}`);
    } else if (change.field_path === "price_per_serving") {
      parts.push(`Price per serving changed to $${change.to ?? "unknown"}`);
    }
  }

  if (parts.length === 0) {
    return `${changes.length} field(s) changed.`;
  }

  return parts.join(". ") + ".";
}

/**
 * Simple deep equality check.
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return a === b;
  if (typeof a !== typeof b) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((val, i) => deepEqual(val, b[i]));
  }

  if (typeof a === "object" && typeof b === "object") {
    const aKeys = Object.keys(a as Record<string, unknown>);
    const bKeys = Object.keys(b as Record<string, unknown>);
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every((key) =>
      deepEqual(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key]
      )
    );
  }

  return false;
}
