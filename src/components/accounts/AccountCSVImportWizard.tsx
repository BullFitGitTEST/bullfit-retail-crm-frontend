"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { Account, AccountInput } from "@/lib/api";
import { getAccounts, createAccount, updateAccount } from "@/lib/api";
import {
  parseCSVFile,
  autoMapAccountColumns,
  validateAccountMapping,
  normalizeAccountRows,
  findAccountDuplicates,
} from "@/lib/csv";
import type { CSVParseResult, AccountDedupResult } from "@/lib/csv";
import { ACCOUNT_MAPPABLE_FIELDS } from "@/lib/csv-constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Props {
  onClose: () => void;
  onImported: (accounts: Account[]) => void;
}

type Step = 1 | 2 | 3 | 4;
type DupAction = "skip" | "update" | "import";

const STEP_TITLES: Record<Step, string> = {
  1: "Upload CSV",
  2: "Map Columns",
  3: "Dedup Check",
  4: "Import",
};

const BATCH_SIZE = 10;

// ---------------------------------------------------------------------------
// Step Indicator
// ---------------------------------------------------------------------------

function StepIndicator({ current }: { current: Step }) {
  return (
    <div className="flex items-center justify-center gap-0 px-6 py-4">
      {([1, 2, 3, 4] as Step[]).map((s, i) => (
        <div key={s} className="flex items-center">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
              s < current
                ? "bg-indigo-600 text-white"
                : s === current
                  ? "bg-indigo-600 text-white ring-2 ring-indigo-400/50 ring-offset-2 ring-offset-slate-900"
                  : "bg-slate-700 text-slate-400"
            }`}
          >
            {s < current ? (
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              s
            )}
          </div>
          <span
            className={`ml-2 hidden text-xs sm:inline ${
              s === current
                ? "font-medium text-white"
                : s < current
                  ? "text-slate-400"
                  : "text-slate-500"
            }`}
          >
            {STEP_TITLES[s]}
          </span>
          {i < 3 && (
            <div
              className={`mx-3 h-0.5 w-10 sm:w-14 ${
                s < current ? "bg-indigo-600" : "bg-slate-700"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Wizard
// ---------------------------------------------------------------------------

export default function AccountCSVImportWizard({ onClose, onImported }: Props) {
  const [step, setStep] = useState<Step>(1);

  // Step 1: Upload
  const [parseResult, setParseResult] = useState<CSVParseResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Step 2: Mapping
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});
  const [mappingValid, setMappingValid] = useState(false);
  const [mappingMissing, setMappingMissing] = useState<string[]>([]);

  // Step 2→3: Normalized rows
  const [normalizedRows, setNormalizedRows] = useState<Partial<AccountInput>[]>([]);

  // Step 3: Dedup
  const [dupResults, setDupResults] = useState<AccountDedupResult[]>([]);
  const [dupActions, setDupActions] = useState<Record<number, DupAction>>({});
  const [dedupLoading, setDedupLoading] = useState(false);

  // Step 4: Import
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, errors: 0 });
  const [importStatus, setImportStatus] = useState<"idle" | "running" | "done">("idle");
  const [importedAccounts, setImportedAccounts] = useState<Account[]>([]);
  const [importErrors, setImportErrors] = useState<{ row: number; error: string }[]>([]);
  const [showErrors, setShowErrors] = useState(false);

  // =========================================================================
  // Step 1 Handlers
  // =========================================================================

  const handleFile = useCallback(async (file: File) => {
    setParseError(null);
    setParseResult(null);
    setFileName(file.name);

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setParseError("Please upload a .csv file");
      return;
    }

    try {
      const result = await parseCSVFile(file);
      setParseResult(result);
    } catch (err: unknown) {
      setParseError(err instanceof Error ? err.message : "Failed to parse CSV");
    }
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  // =========================================================================
  // Step 2 Handlers
  // =========================================================================

  useEffect(() => {
    if (step === 2 && parseResult && Object.keys(columnMap).length === 0) {
      const auto = autoMapAccountColumns(parseResult.headers);
      setColumnMap(auto);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  useEffect(() => {
    const { valid, missing } = validateAccountMapping(columnMap);
    setMappingValid(valid);
    setMappingMissing(missing);
  }, [columnMap]);

  function handleMappingChange(csvHeader: string, field: string) {
    setColumnMap((prev) => {
      const next = { ...prev };
      if (field === "") {
        delete next[csvHeader];
      } else {
        next[csvHeader] = field;
      }
      return next;
    });
  }

  // =========================================================================
  // Step 3 Handlers (Dedup)
  // =========================================================================

  useEffect(() => {
    if (step === 3 && parseResult) {
      // Normalize rows first
      const rows = normalizeAccountRows(parseResult.rows, parseResult.headers, columnMap);
      setNormalizedRows(rows);

      // Then run dedup
      setDedupLoading(true);
      getAccounts()
        .then((existing) => {
          const dups = findAccountDuplicates(rows, existing);
          setDupResults(dups);
          const actions: Record<number, DupAction> = {};
          dups.forEach((d) => {
            actions[d.rowIndex] = "skip";
          });
          setDupActions(actions);
        })
        .catch(() => {
          setDupResults([]);
        })
        .finally(() => setDedupLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  function setAllDupAction(action: DupAction) {
    const actions: Record<number, DupAction> = {};
    dupResults.forEach((d) => {
      actions[d.rowIndex] = action;
    });
    setDupActions(actions);
  }

  // =========================================================================
  // Step 4 Handlers (Import)
  // =========================================================================

  async function executeImport() {
    setImportStatus("running");
    setImportErrors([]);
    setImportedAccounts([]);

    const dupIndexes = new Set(dupResults.map((d) => d.rowIndex));

    const toProcess: {
      rowIndex: number;
      data: Partial<AccountInput>;
      action: "create" | "update";
      existingId?: string;
    }[] = [];

    normalizedRows.forEach((row, idx) => {
      if (dupIndexes.has(idx)) {
        const action = dupActions[idx] || "skip";
        if (action === "skip") return;
        const dup = dupResults.find((d) => d.rowIndex === idx);
        if (action === "update" && dup) {
          toProcess.push({
            rowIndex: idx,
            data: row,
            action: "update",
            existingId: dup.existingAccount.id,
          });
        } else {
          toProcess.push({ rowIndex: idx, data: row, action: "create" });
        }
      } else {
        toProcess.push({ rowIndex: idx, data: row, action: "create" });
      }
    });

    const total = toProcess.length;
    setImportProgress({ current: 0, total, errors: 0 });

    const imported: Account[] = [];
    const errors: { row: number; error: string }[] = [];

    for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
      const batch = toProcess.slice(i, i + BATCH_SIZE);

      const results = await Promise.allSettled(
        batch.map(async (item) => {
          if (item.action === "update" && item.existingId) {
            return await updateAccount(item.existingId, item.data);
          }
          return await createAccount(item.data as AccountInput);
        })
      );

      results.forEach((result, j) => {
        if (result.status === "fulfilled") {
          imported.push(result.value);
        } else {
          errors.push({
            row: batch[j].rowIndex + 1,
            error: result.reason?.message || "Unknown error",
          });
        }
      });

      setImportProgress({
        current: Math.min(i + BATCH_SIZE, total),
        total,
        errors: errors.length,
      });
    }

    setImportedAccounts(imported);
    setImportErrors(errors);
    setImportStatus("done");
  }

  function handleReset() {
    setStep(1);
    setParseResult(null);
    setParseError(null);
    setFileName("");
    setColumnMap({});
    setNormalizedRows([]);
    setDupResults([]);
    setDupActions({});
    setImportProgress({ current: 0, total: 0, errors: 0 });
    setImportStatus("idle");
    setImportedAccounts([]);
    setImportErrors([]);
    setShowErrors(false);
  }

  function handleDone() {
    if (importedAccounts.length > 0) {
      onImported(importedAccounts);
    }
    onClose();
  }

  // =========================================================================
  // Navigation
  // =========================================================================

  function canGoNext(): boolean {
    if (step === 1) return !!parseResult;
    if (step === 2) return mappingValid;
    if (step === 3) return !dedupLoading;
    return false;
  }

  function handleNext() {
    if (step < 4) setStep((s) => (s + 1) as Step);
    if (step === 3) {
      setTimeout(() => executeImport(), 100);
    }
  }

  // =========================================================================
  // Computed values
  // =========================================================================

  const dupSkipped = dupResults.filter((d) => dupActions[d.rowIndex] === "skip").length;
  const dupUpdated = dupResults.filter((d) => dupActions[d.rowIndex] === "update").length;
  const newCount = normalizedRows.length - dupResults.length;

  // =========================================================================
  // Render
  // =========================================================================

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-5xl max-h-[90vh] flex flex-col rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Import Accounts from CSV
            </h2>
            <p className="text-sm text-slate-400">
              Step {step} of 4 &mdash; {STEP_TITLES[step]}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xl"
          >
            &times;
          </button>
        </div>

        <StepIndicator current={step} />

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {/* ============================================================= */}
          {/* STEP 1 — Upload */}
          {/* ============================================================= */}
          {step === 1 && (
            <div className="space-y-4">
              {/* How it works */}
              <div className="rounded-xl border border-indigo-500/20 bg-gradient-to-br from-slate-800 to-slate-900 p-5">
                <p className="text-xs font-medium text-indigo-400 uppercase tracking-wider mb-3">
                  How it works
                </p>
                <p className="text-sm text-slate-300 mb-3">
                  Import your existing retail accounts from a CSV file in 4 quick steps.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  {[
                    { s: "1", title: "Upload", desc: "Drop a CSV file (up to 5,000 rows). We auto-detect delimiter and columns." },
                    { s: "2", title: "Map", desc: "Match your CSV columns to BullFit account fields. Auto-suggested for you." },
                    { s: "3", title: "Dedup", desc: "We check for duplicates by name and website. You decide what to do." },
                    { s: "4", title: "Import", desc: "Accounts are created in batches. Review the summary when done." },
                  ].map((item) => (
                    <div key={item.s} className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600/30 text-[10px] font-bold text-indigo-300">
                          {item.s}
                        </span>
                        <span className="text-xs font-semibold text-white">{item.title}</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-slate-700/50">
                  <h4 className="text-xs font-semibold text-white uppercase tracking-wide mb-1.5">
                    Tips for best results
                  </h4>
                  <ul className="space-y-1">
                    {[
                      "Include an Account Name column \u2014 it\u2019s the only required field",
                      "Add website URLs for better duplicate detection",
                      "Industry, annual revenue, and employee count are optional but useful",
                      "Clean your file first: remove blank rows and header duplicates",
                    ].map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                        <span className="text-indigo-500 mt-0.5 flex-shrink-0">&#8250;</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition ${
                  dragOver
                    ? "border-indigo-400 bg-indigo-600/10"
                    : "border-slate-600 hover:border-slate-500 hover:bg-slate-800/50"
                }`}
              >
                <svg
                  className="mb-3 h-10 w-10 text-slate-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                  />
                </svg>
                <p className="text-sm font-medium text-white">
                  Drop your CSV file here or click to browse
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Maximum 5,000 rows per upload
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </div>

              {parseError && (
                <div className="rounded-lg border border-red-700/50 bg-red-900/20 px-4 py-3 text-sm text-red-300">
                  {parseError}
                </div>
              )}

              {parseResult && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-400">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{fileName}</p>
                        <p className="text-xs text-slate-400">
                          {parseResult.totalRows.toLocaleString()} rows &bull;{" "}
                          {parseResult.headers.length} columns &bull; delimiter:{" "}
                          {parseResult.delimiter === "," ? "comma" : parseResult.delimiter === "\t" ? "tab" : parseResult.delimiter}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => { setParseResult(null); setFileName(""); if (fileRef.current) fileRef.current.value = ""; }}
                      className="text-xs text-slate-400 hover:text-red-400"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-700">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-700 bg-slate-800/50">
                          <th className="px-3 py-2 text-left font-medium uppercase text-slate-500">#</th>
                          {parseResult.headers.map((h) => (
                            <th key={h} className="px-3 py-2 text-left font-medium uppercase text-slate-400">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/50">
                        {parseResult.rows.slice(0, 10).map((row, i) => (
                          <tr key={i} className="hover:bg-slate-800/50 transition-colors">
                            <td className="px-3 py-2 text-slate-500">{i + 1}</td>
                            {row.map((cell, j) => (
                              <td key={j} className="px-3 py-2 text-slate-300 max-w-[200px] truncate">
                                {cell || <span className="text-slate-600">&mdash;</span>}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {parseResult.totalRows > 10 && (
                    <p className="text-xs text-slate-500 text-center">
                      Showing first 10 of {parseResult.totalRows.toLocaleString()} rows
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ============================================================= */}
          {/* STEP 2 — Map Columns */}
          {/* ============================================================= */}
          {step === 2 && parseResult && (
            <div className="space-y-4">
              <p className="text-sm text-slate-400">
                Map your CSV columns to BullFit account fields. Required fields are marked with *.
              </p>

              {!mappingValid && mappingMissing.length > 0 && (
                <div className="rounded-lg border border-red-700/50 bg-red-900/20 px-4 py-3 text-sm text-red-300">
                  Missing required fields: {mappingMissing.join(", ")}
                </div>
              )}

              <div className="space-y-2">
                {parseResult.headers.map((header) => {
                  const sampleValues = parseResult.rows
                    .slice(0, 3)
                    .map((r) => r[parseResult.headers.indexOf(header)])
                    .filter(Boolean);

                  return (
                    <div
                      key={header}
                      className="flex items-center gap-4 rounded-lg border border-slate-700 bg-slate-800 px-4 py-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{header}</p>
                        {sampleValues.length > 0 && (
                          <p className="text-xs text-slate-500 truncate mt-0.5">
                            e.g. {sampleValues.join(", ")}
                          </p>
                        )}
                      </div>
                      <svg
                        className="h-4 w-4 flex-shrink-0 text-slate-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      <select
                        value={columnMap[header] || ""}
                        onChange={(e) => handleMappingChange(header, e.target.value)}
                        className={`w-56 rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none ${
                          columnMap[header]
                            ? "border-indigo-500/30 bg-indigo-600/10 text-indigo-300"
                            : "border-slate-600 bg-slate-900 text-slate-400"
                        }`}
                      >
                        <option value="">Skip this column</option>
                        {ACCOUNT_MAPPABLE_FIELDS.map((f) => (
                          <option key={f.key} value={f.key}>
                            {f.label}{f.required ? " *" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>

              {/* Preview of mapped data */}
              {mappingValid && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                    Preview (first 5 rows)
                  </p>
                  <div className="overflow-x-auto rounded-xl border border-slate-700">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-700 bg-slate-800/50">
                          <th className="px-3 py-2 text-left font-medium uppercase text-slate-500">#</th>
                          <th className="px-3 py-2 text-left font-medium uppercase text-slate-400">Name</th>
                          <th className="px-3 py-2 text-left font-medium uppercase text-slate-400">Website</th>
                          <th className="px-3 py-2 text-left font-medium uppercase text-slate-400">Industry</th>
                          <th className="px-3 py-2 text-left font-medium uppercase text-slate-400">Revenue</th>
                          <th className="px-3 py-2 text-left font-medium uppercase text-slate-400">Employees</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/50">
                        {(() => {
                          const preview = normalizeAccountRows(
                            parseResult.rows.slice(0, 5),
                            parseResult.headers,
                            columnMap
                          );
                          return preview.map((row, i) => (
                            <tr key={i} className="hover:bg-slate-800/50 transition-colors">
                              <td className="px-3 py-2 text-slate-500">{i + 1}</td>
                              <td className="px-3 py-2 text-white font-medium max-w-[200px] truncate">
                                {row.name || <span className="text-slate-600">&mdash;</span>}
                              </td>
                              <td className="px-3 py-2 text-slate-400 max-w-[200px] truncate">
                                {row.website || <span className="text-slate-600">&mdash;</span>}
                              </td>
                              <td className="px-3 py-2 text-slate-400 capitalize">
                                {row.industry?.replace("_", " ") || <span className="text-slate-600">&mdash;</span>}
                              </td>
                              <td className="px-3 py-2 text-slate-400">
                                {row.annual_revenue
                                  ? `$${row.annual_revenue.toLocaleString()}`
                                  : <span className="text-slate-600">&mdash;</span>}
                              </td>
                              <td className="px-3 py-2 text-slate-400">
                                {row.employee_count?.toLocaleString() || <span className="text-slate-600">&mdash;</span>}
                              </td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================= */}
          {/* STEP 3 — Dedup Check */}
          {/* ============================================================= */}
          {step === 3 && (
            <div className="space-y-4">
              {dedupLoading ? (
                <div className="py-12 text-center text-slate-400">
                  Checking for duplicates...
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-center">
                      <p className="text-2xl font-bold text-green-400">{newCount}</p>
                      <p className="text-xs text-slate-400 mt-1">New</p>
                    </div>
                    <div className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-center">
                      <p className="text-2xl font-bold text-amber-400">{dupResults.length}</p>
                      <p className="text-xs text-slate-400 mt-1">Duplicates</p>
                    </div>
                    <div className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-center">
                      <p className="text-2xl font-bold text-white">{normalizedRows.length}</p>
                      <p className="text-xs text-slate-400 mt-1">Total</p>
                    </div>
                  </div>

                  {dupResults.length === 0 ? (
                    <div className="rounded-lg border border-green-700/50 bg-green-900/20 px-4 py-3 text-sm text-green-300">
                      No duplicates found. All {normalizedRows.length} rows are new.
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-400">
                          {dupResults.length} potential duplicate{dupResults.length !== 1 ? "s" : ""} found.
                        </p>
                        <div className="flex gap-2">
                          <button onClick={() => setAllDupAction("skip")} className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 transition">Skip All</button>
                          <button onClick={() => setAllDupAction("update")} className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 transition">Update All</button>
                          <button onClick={() => setAllDupAction("import")} className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 transition">Import All Anyway</button>
                        </div>
                      </div>

                      <div className="overflow-x-auto rounded-xl border border-slate-700">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-slate-700 bg-slate-800/50">
                              <th className="px-3 py-2 text-left font-medium uppercase text-slate-500">Row</th>
                              <th className="px-3 py-2 text-left font-medium uppercase text-slate-400">CSV Account</th>
                              <th className="px-3 py-2 text-left font-medium uppercase text-slate-400">Match Type</th>
                              <th className="px-3 py-2 text-left font-medium uppercase text-slate-400">Existing Match</th>
                              <th className="px-3 py-2 text-left font-medium uppercase text-slate-400">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-700/50">
                            {dupResults.map((dup) => (
                              <tr key={dup.rowIndex} className="hover:bg-slate-800/50 transition-colors">
                                <td className="px-3 py-2 text-slate-500">{dup.rowIndex + 1}</td>
                                <td className="px-3 py-2 text-white font-medium max-w-[200px] truncate">
                                  {dup.csvRow.name || "\u2014"}
                                </td>
                                <td className="px-3 py-2">
                                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                                    dup.matchType === "website"
                                      ? "bg-red-600/20 text-red-300"
                                      : "bg-amber-600/20 text-amber-300"
                                  }`}>
                                    {dup.matchType === "website" ? "Website" : "Name"}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-slate-300 max-w-[200px] truncate">
                                  {dup.existingAccount.name}
                                  {dup.existingAccount.website && ` (${dup.existingAccount.website})`}
                                </td>
                                <td className="px-3 py-2">
                                  <select
                                    value={dupActions[dup.rowIndex] || "skip"}
                                    onChange={(e) => setDupActions((prev) => ({ ...prev, [dup.rowIndex]: e.target.value as DupAction }))}
                                    className="rounded-lg border border-slate-600 bg-slate-900 px-2 py-1 text-xs text-white focus:border-indigo-500 focus:outline-none"
                                  >
                                    <option value="skip">Skip</option>
                                    <option value="update">Update Existing</option>
                                    <option value="import">Import Anyway</option>
                                  </select>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}

                  <div className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-slate-300">
                    Ready to import:{" "}
                    <span className="font-medium text-white">{newCount} new</span>
                    {dupUpdated > 0 && (
                      <>, <span className="font-medium text-amber-300">{dupUpdated} updates</span></>
                    )}
                    {dupSkipped > 0 && (
                      <>, <span className="text-slate-500">{dupSkipped} skipped</span></>
                    )}
                    {dupResults.filter((d) => dupActions[d.rowIndex] === "import").length > 0 && (
                      <>, <span className="font-medium text-indigo-300">
                        {dupResults.filter((d) => dupActions[d.rowIndex] === "import").length} force-imported
                      </span></>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ============================================================= */}
          {/* STEP 4 — Import */}
          {/* ============================================================= */}
          {step === 4 && (
            <div className="space-y-4">
              {importStatus === "running" && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-white">Importing accounts...</p>
                  <div className="w-full rounded-full bg-slate-700 h-3">
                    <div
                      className="h-3 rounded-full bg-indigo-600 transition-all duration-300"
                      style={{
                        width: `${importProgress.total > 0 ? (importProgress.current / importProgress.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <p className="text-sm text-slate-400">
                    {importProgress.current} of {importProgress.total} processed
                    {importProgress.errors > 0 && (
                      <span className="text-red-400"> ({importProgress.errors} errors)</span>
                    )}
                  </p>
                </div>
              )}

              {importStatus === "done" && (
                <div className="space-y-4">
                  {importedAccounts.length > 0 && (
                    <div className="rounded-lg border border-green-700/50 bg-green-900/20 px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600/20">
                          <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-green-300">Import Complete</p>
                          <p className="text-xs text-green-400/70 mt-0.5">
                            {importedAccounts.length} account{importedAccounts.length !== 1 ? "s" : ""} imported successfully
                            {dupSkipped > 0 && ` | ${dupSkipped} duplicates skipped`}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {importErrors.length > 0 && (
                    <div className="rounded-lg border border-red-700/50 bg-red-900/20 px-4 py-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-red-300">
                          {importErrors.length} row{importErrors.length !== 1 ? "s" : ""} failed to import
                        </p>
                        <button onClick={() => setShowErrors((p) => !p)} className="text-xs text-red-400 hover:text-red-300">
                          {showErrors ? "Hide" : "Show"} details
                        </button>
                      </div>
                      {showErrors && (
                        <div className="mt-3 max-h-40 overflow-y-auto space-y-1">
                          {importErrors.map((err, i) => (
                            <p key={i} className="text-xs text-red-400/70">Row {err.row}: {err.error}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-4 gap-3">
                    <div className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-center">
                      <p className="text-2xl font-bold text-green-400">{importedAccounts.length}</p>
                      <p className="text-xs text-slate-400 mt-1">Imported</p>
                    </div>
                    <div className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-center">
                      <p className="text-2xl font-bold text-amber-400">{dupUpdated}</p>
                      <p className="text-xs text-slate-400 mt-1">Updated</p>
                    </div>
                    <div className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-center">
                      <p className="text-2xl font-bold text-slate-500">{dupSkipped}</p>
                      <p className="text-xs text-slate-400 mt-1">Skipped</p>
                    </div>
                    <div className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-center">
                      <p className="text-2xl font-bold text-red-400">{importErrors.length}</p>
                      <p className="text-xs text-slate-400 mt-1">Errors</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button onClick={handleReset} className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition">
                      Import Another
                    </button>
                    <button onClick={handleDone} className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition">
                      View Accounts
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        {step < 4 && (
          <div className="flex items-center justify-between border-t border-slate-700 px-6 py-4">
            {step > 1 ? (
              <button
                onClick={() => setStep((s) => (s - 1) as Step)}
                className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition"
              >
                Back
              </button>
            ) : (
              <div />
            )}
            <button
              onClick={handleNext}
              disabled={!canGoNext()}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition"
            >
              {step === 3 ? "Start Import" : "Next"}
            </button>
          </div>
        )}

        {step === 4 && importStatus === "idle" && (
          <div className="flex justify-end border-t border-slate-700 px-6 py-4">
            <button onClick={onClose} className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition">
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
