import Papa from "papaparse";
import type { ProspectInput, Prospect } from "./api";
import { US_STATE_MAP, COLUMN_ALIASES } from "./csv-constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CSVParseResult {
  headers: string[];
  rows: string[][]; // data rows (no header)
  delimiter: string;
  totalRows: number;
}

export interface DedupResult {
  rowIndex: number;
  csvRow: Partial<ProspectInput>;
  matchType: "website" | "name_city" | "phone" | "email";
  existingProspect: Prospect;
}

// ---------------------------------------------------------------------------
// CSV Parsing
// ---------------------------------------------------------------------------

const MAX_ROWS = 5_000;

export function parseCSVFile(file: File): Promise<CSVParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      skipEmptyLines: true,
      complete(results) {
        if (!results.data || results.data.length === 0) {
          reject(new Error("CSV file is empty"));
          return;
        }
        const allRows = results.data as string[][];
        const headers = allRows[0].map((h) => h.trim());
        const rows = allRows
          .slice(1)
          .filter((row) => row.some((cell) => cell.trim() !== ""));

        if (rows.length > MAX_ROWS) {
          reject(
            new Error(
              `CSV has ${rows.length.toLocaleString()} rows. Maximum is ${MAX_ROWS.toLocaleString()}.`
            )
          );
          return;
        }

        resolve({
          headers,
          rows,
          delimiter: results.meta.delimiter,
          totalRows: rows.length,
        });
      },
      error(err: Error) {
        reject(new Error(`Failed to parse CSV: ${err.message}`));
      },
    });
  });
}

// ---------------------------------------------------------------------------
// Column Auto-Mapping
// ---------------------------------------------------------------------------

export function autoMapColumns(
  csvHeaders: string[]
): Record<string, string> {
  const mapping: Record<string, string> = {};
  const usedFields = new Set<string>();

  const normalized = csvHeaders.map((h) =>
    h.toLowerCase().trim().replace(/[_\-]/g, " ")
  );

  // Pass 1: exact alias match
  for (let i = 0; i < normalized.length; i++) {
    const norm = normalized[i];
    for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
      if (usedFields.has(field)) continue;
      if (aliases.includes(norm)) {
        mapping[csvHeaders[i]] = field;
        usedFields.add(field);
        break;
      }
    }
  }

  // Pass 2: substring match for remaining
  for (let i = 0; i < normalized.length; i++) {
    if (mapping[csvHeaders[i]]) continue;
    const norm = normalized[i];
    for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
      if (usedFields.has(field)) continue;
      const match = aliases.some(
        (alias) => norm.includes(alias) || alias.includes(norm)
      );
      if (match) {
        mapping[csvHeaders[i]] = field;
        usedFields.add(field);
        break;
      }
    }
  }

  return mapping;
}

// ---------------------------------------------------------------------------
// Mapping Validation
// ---------------------------------------------------------------------------

export function validateMapping(
  mapping: Record<string, string>
): { valid: boolean; missing: string[] } {
  const mapped = new Set(Object.values(mapping));
  const missing: string[] = [];

  if (!mapped.has("business_name")) missing.push("Business Name");

  const hasContact =
    mapped.has("contact_first_name") ||
    mapped.has("contact_last_name") ||
    mapped.has("email") ||
    mapped.has("__contact_name");
  if (!hasContact) missing.push("Contact Name, First Name, Last Name, or Email");

  return { valid: missing.length === 0, missing };
}

// ---------------------------------------------------------------------------
// Normalization Utilities
// ---------------------------------------------------------------------------

export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits[0] === "1") {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return raw.trim();
}

export function normalizeState(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.length === 2) return trimmed.toUpperCase();
  return US_STATE_MAP[trimmed.toLowerCase()] || trimmed;
}

export function splitContactName(fullName: string): {
  first: string;
  last: string;
} {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return { first: "", last: "" };
  if (parts.length === 1) return { first: parts[0], last: "" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

const VALID_STORE_TYPES = new Set([
  "pharmacy",
  "health_food",
  "gym",
  "supplement",
  "grocery",
  "other",
]);

export function normalizeStoreType(raw: string): string {
  const lower = raw.toLowerCase().trim();
  // Already a valid enum value
  if (VALID_STORE_TYPES.has(lower)) return lower;
  // Common freeform mappings
  if (/gym|fitness|crossfit|athletic|training/.test(lower)) return "gym";
  if (/supplement|vitamin|nutrition|gnc|nutr/.test(lower)) return "supplement";
  if (/pharmacy|pharm|drug|rx/.test(lower)) return "pharmacy";
  if (/health.?food|natural|organic|health/.test(lower)) return "health_food";
  if (/grocery|market|supermarket|food.?store/.test(lower)) return "grocery";
  return "other";
}

export function inferStoreType(businessName: string): string {
  const lower = businessName.toLowerCase();
  if (/\b(gym|fitness|crossfit|athletic|training)\b/.test(lower)) return "gym";
  if (/\b(gnc|vitamin|supplement|nutrition|nutr)\b/.test(lower))
    return "supplement";
  if (/\b(pharmacy|pharm|drug|rx|cvs|walgreens|rite.aid)\b/.test(lower))
    return "pharmacy";
  if (/\b(health.?food|natural|organic|whole.?foods|sprouts)\b/.test(lower))
    return "health_food";
  if (/\b(grocery|market|supermarket|food.?store|kroger|safeway)\b/.test(lower))
    return "grocery";
  return "other";
}

// ---------------------------------------------------------------------------
// Row Normalization Pipeline
// ---------------------------------------------------------------------------

export function normalizeRows(
  rawRows: string[][],
  headers: string[],
  columnMap: Record<string, string>
): Partial<ProspectInput>[] {
  return rawRows.map((row) => {
    const prospect: Record<string, unknown> = {};

    headers.forEach((header, idx) => {
      const field = columnMap[header];
      if (!field) return;
      const value = (row[idx] ?? "").trim();
      if (!value) return;

      if (field === "__contact_name") {
        const { first, last } = splitContactName(value);
        if (!prospect.contact_first_name) prospect.contact_first_name = first;
        if (!prospect.contact_last_name) prospect.contact_last_name = last;
      } else if (field === "phone") {
        prospect.phone = normalizePhone(value);
      } else if (field === "state") {
        prospect.state = normalizeState(value);
      } else if (field === "store_type") {
        prospect.store_type = normalizeStoreType(value);
      } else if (field === "estimated_monthly_volume") {
        const num = parseFloat(value.replace(/[$,]/g, ""));
        if (!isNaN(num)) prospect.estimated_monthly_volume = num;
      } else {
        prospect[field] = value;
      }
    });

    // Defaults
    if (!prospect.pipeline_stage) prospect.pipeline_stage = "lead";
    if (!prospect.source) prospect.source = "manual";
    if (!prospect.store_type && prospect.business_name) {
      prospect.store_type = inferStoreType(prospect.business_name as string);
    }

    return prospect as Partial<ProspectInput>;
  });
}

// ---------------------------------------------------------------------------
// Deduplication
// ---------------------------------------------------------------------------

function normalizeURL(url: string): string {
  return url
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/+$/, "");
}

export function findDuplicates(
  normalizedRows: Partial<ProspectInput>[],
  existingProspects: Prospect[]
): DedupResult[] {
  // Build lookup indexes
  const byWebsite = new Map<string, Prospect>();
  const byNameCity = new Map<string, Prospect>();
  const byPhone = new Map<string, Prospect>();
  const byEmail = new Map<string, Prospect>();

  for (const p of existingProspects) {
    if (p.website) byWebsite.set(normalizeURL(p.website), p);
    if (p.business_name && p.city) {
      byNameCity.set(
        `${p.business_name.toLowerCase()}|${p.city.toLowerCase()}`,
        p
      );
    }
    if (p.phone) byPhone.set(p.phone.replace(/\D/g, ""), p);
    if (p.email) byEmail.set(p.email.toLowerCase(), p);
  }

  const results: DedupResult[] = [];

  normalizedRows.forEach((row, idx) => {
    // Website match
    if (row.website) {
      const match = byWebsite.get(normalizeURL(row.website));
      if (match) {
        results.push({
          rowIndex: idx,
          csvRow: row,
          matchType: "website",
          existingProspect: match,
        });
        return;
      }
    }

    // Business name + city
    if (row.business_name && row.city) {
      const key = `${row.business_name.toLowerCase()}|${row.city.toLowerCase()}`;
      const match = byNameCity.get(key);
      if (match) {
        results.push({
          rowIndex: idx,
          csvRow: row,
          matchType: "name_city",
          existingProspect: match,
        });
        return;
      }
    }

    // Phone
    if (row.phone) {
      const digits = row.phone.replace(/\D/g, "");
      if (digits.length >= 10) {
        const match = byPhone.get(digits);
        if (match) {
          results.push({
            rowIndex: idx,
            csvRow: row,
            matchType: "phone",
            existingProspect: match,
          });
          return;
        }
      }
    }

    // Email
    if (row.email) {
      const match = byEmail.get(row.email.toLowerCase());
      if (match) {
        results.push({
          rowIndex: idx,
          csvRow: row,
          matchType: "email",
          existingProspect: match,
        });
      }
    }
  });

  return results;
}
