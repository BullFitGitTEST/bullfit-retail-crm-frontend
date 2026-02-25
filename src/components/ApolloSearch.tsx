"use client";

import { useState } from "react";
import { createProspect } from "@/lib/api";
import type { Prospect } from "@/lib/api";

interface ApolloPerson {
  id: string;
  first_name: string;
  last_name?: string;
  last_name_obfuscated?: string;
  title: string;
  email?: string;
  city?: string;
  state?: string;
  linkedin_url?: string;
  has_email?: boolean;
  has_city?: boolean;
  has_state?: boolean;
  has_direct_phone?: string;
  phone_numbers?: { sanitized_number: string }[];
  organization?: {
    id: string;
    name: string;
    website_url?: string;
    industry?: string;
    estimated_num_employees?: number;
    city?: string;
    state?: string;
    street_address?: string;
    postal_code?: string;
    has_industry?: boolean;
    has_city?: boolean;
    has_state?: boolean;
  };
  // Flags for revealed data
  _revealed?: boolean;
}

interface ApolloSearchProps {
  onClose: () => void;
  onImported: (prospects: Prospect[]) => void;
}

const KEYWORD_OPTIONS = [
  "fitness",
  "supplement",
  "retail",
  "wellness",
  "gym",
  "nutrition",
  "health food",
  "sports",
];

const TITLE_OPTIONS = [
  "Owner",
  "CEO",
  "Buyer",
  "Purchasing Manager",
  "General Manager",
  "VP of Procurement",
];

const SIZE_OPTIONS = [
  { label: "1-10", value: "1,10" },
  { label: "11-50", value: "11,50" },
  { label: "51-200", value: "51,200" },
  { label: "201-1000", value: "201,1000" },
];

function storeTypeFromIndustry(industry?: string): string {
  if (!industry) return "other";
  const lower = industry.toLowerCase();
  if (lower.includes("gym") || lower.includes("fitness")) return "gym";
  if (lower.includes("health") || lower.includes("food")) return "health_food";
  if (lower.includes("supplement")) return "supplement";
  if (lower.includes("pharmacy") || lower.includes("drug")) return "pharmacy";
  if (lower.includes("grocery")) return "grocery";
  return "other";
}

export default function ApolloSearch({ onClose, onImported }: ApolloSearchProps) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ApolloPerson[]>([]);
  const [pagination, setPagination] = useState<{ total_entries?: number; total_pages?: number }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState<ApolloPerson[]>([]);
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{ imported: number; errors: number } | null>(null);

  // Filters
  const [keywords, setKeywords] = useState<string[]>(["fitness", "supplement"]);
  const [titles, setTitles] = useState<string[]>(["Owner", "Buyer"]);
  const [location, setLocation] = useState("United States");
  const [sizes, setSizes] = useState<string[]>([]);

  // Outreach
  const [outreachPerson, setOutreachPerson] = useState<ApolloPerson | null>(null);
  const [outreachLoading, setOutreachLoading] = useState(false);
  const [outreachData, setOutreachData] = useState<{ email: string; subject: string } | null>(null);
  const [copied, setCopied] = useState(false);

  function toggleItem<T>(arr: T[], setArr: React.Dispatch<React.SetStateAction<T[]>>, item: T) {
    setArr((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  }

  async function handleSearch(page = 1) {
    setLoading(true);
    setImportStatus(null);
    try {
      const res = await fetch("/api/apollo/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keywords,
          personTitles: titles,
          locations: location ? [location] : [],
          employeeRanges: sizes,
          page,
          perPage: 25,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResults(data.people || []);
      setPagination(data.pagination || {});
      setCurrentPage(page);
      setSelected([]);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function revealPerson(apolloId: string): Promise<ApolloPerson | null> {
    try {
      const res = await fetch("/api/apollo/reveal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apolloId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data.person ? { ...data.person, _revealed: true } : null;
    } catch (err) {
      console.error("Reveal error:", err);
      return null;
    }
  }

  async function handleImport() {
    if (selected.length === 0) return;
    setImporting(true);
    let imported = 0;
    let errors = 0;

    const newProspects: Prospect[] = [];

    for (const person of selected) {
      try {
        // Reveal full contact data first (costs 1 Apollo credit per person)
        const revealed = await revealPerson(person.id);
        const p = revealed || person;

        const prospect = await createProspect({
          business_name: p.organization?.name || `${p.first_name} ${p.last_name || ""}`.trim(),
          contact_first_name: p.first_name,
          contact_last_name: p.last_name || undefined,
          email: p.email || undefined,
          phone: p.phone_numbers?.[0]?.sanitized_number || undefined,
          website: p.organization?.website_url || undefined,
          city: p.organization?.city || p.city || undefined,
          state: p.organization?.state || p.state || undefined,
          store_type: storeTypeFromIndustry(p.organization?.industry),
          source: "apollo",
          notes: `Imported from Apollo.io | Title: ${p.title || "N/A"} | Industry: ${p.organization?.industry || "N/A"} | Employees: ${p.organization?.estimated_num_employees || "N/A"}${p.linkedin_url ? ` | LinkedIn: ${p.linkedin_url}` : ""}`,
        });
        newProspects.push(prospect);
        imported++;
      } catch (err) {
        console.error("Import error for", person.first_name, err);
        errors++;
      }
    }

    setImportStatus({ imported, errors });
    setSelected([]);
    if (newProspects.length > 0) {
      onImported(newProspects);
    }
    setImporting(false);
  }

  function toggleSelect(person: ApolloPerson) {
    setSelected((prev) =>
      prev.some((p) => p.id === person.id)
        ? prev.filter((p) => p.id !== person.id)
        : [...prev, person]
    );
  }

  function toggleSelectAll() {
    if (selected.length === results.length) {
      setSelected([]);
    } else {
      setSelected([...results]);
    }
  }

  async function handleOutreach(person: ApolloPerson) {
    setOutreachPerson(person);
    setOutreachLoading(true);
    setOutreachData(null);
    setCopied(false);
    try {
      const res = await fetch("/api/apollo/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ person }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOutreachData(data);
    } catch (err) {
      console.error("Outreach error:", err);
      setOutreachData({ email: "Failed to generate email. Check that OPENAI_API_KEY is set.", subject: "" });
    } finally {
      setOutreachLoading(false);
    }
  }

  function handleCopy() {
    if (outreachData?.email) {
      navigator.clipboard.writeText(outreachData.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-700 bg-slate-900 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Find Retailers with Apollo.io</h2>
            <p className="text-sm text-slate-400">Search 275M+ contacts to find retail partners</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">
            &times;
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Search Filters */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Industry Keywords</label>
              <div className="flex flex-wrap gap-2">
                {KEYWORD_OPTIONS.map((kw) => (
                  <button
                    key={kw}
                    onClick={() => toggleItem(keywords, setKeywords, kw)}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                      keywords.includes(kw)
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-800 text-slate-300 border border-slate-600 hover:text-white"
                    }`}
                  >
                    {kw}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Job Titles</label>
              <div className="flex flex-wrap gap-2">
                {TITLE_OPTIONS.map((t) => (
                  <button
                    key={t}
                    onClick={() => toggleItem(titles, setTitles, t)}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                      titles.includes(t)
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-800 text-slate-300 border border-slate-600 hover:text-white"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. United States, California"
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Company Size</label>
                <div className="flex flex-wrap gap-2">
                  {SIZE_OPTIONS.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => toggleItem(sizes, setSizes, s.value)}
                      className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                        sizes.includes(s.value)
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-800 text-slate-300 border border-slate-600 hover:text-white"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => handleSearch(1)}
                disabled={loading || keywords.length === 0}
                className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition"
              >
                {loading ? "Searching..." : "Search Apollo.io"}
              </button>
            </div>
          </div>

          {/* Import Status */}
          {importStatus && (
            <div className="flex items-center justify-between rounded-lg border border-green-700/50 bg-green-900/20 px-4 py-3">
              <p className="text-sm text-green-300 font-medium">
                Imported {importStatus.imported} prospect{importStatus.imported !== 1 ? "s" : ""}
                {importStatus.errors > 0 && (
                  <span className="text-red-400"> ({importStatus.errors} failed)</span>
                )}
              </p>
              <button onClick={() => setImportStatus(null)} className="text-slate-400 hover:text-white">
                &times;
              </button>
            </div>
          )}

          {/* Action Bar */}
          {results.length > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">
                {pagination.total_entries || 0} results
                {selected.length > 0 && ` \u2022 ${selected.length} selected`}
              </p>
              <div className="flex gap-2">
                {selected.length === 1 && (
                  <button
                    onClick={() => handleOutreach(selected[0])}
                    className="rounded-lg border border-indigo-500/30 bg-slate-800 px-4 py-1.5 text-sm font-medium text-indigo-400 hover:bg-indigo-600/10 transition"
                  >
                    AI Outreach
                  </button>
                )}
                {selected.length > 0 && (
                  <button
                    onClick={handleImport}
                    disabled={importing}
                    className="rounded-lg bg-indigo-600 px-5 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition"
                  >
                    {importing ? "Revealing & Importing..." : `Reveal & Import ${selected.length}`}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Results Table */}
          {results.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-slate-700">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-800/50">
                    <th className="px-4 py-3 text-left w-10">
                      <input
                        type="checkbox"
                        checked={selected.length > 0 && selected.length === results.length}
                        onChange={toggleSelectAll}
                        className="accent-indigo-500"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-400">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-400">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-400">Company</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-400">Location</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-400">Employees</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {results.map((person) => {
                    const isSelected = selected.some((p) => p.id === person.id);
                    return (
                      <tr
                        key={person.id}
                        className={`transition-colors hover:bg-slate-800/50 ${isSelected ? "bg-indigo-600/5" : ""}`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(person)}
                            className="accent-indigo-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-white">
                            {person.first_name} {person.last_name || person.last_name_obfuscated || ""}
                          </div>
                          {person.email ? (
                            <div className="text-xs text-slate-500 mt-0.5">{person.email}</div>
                          ) : person.has_email ? (
                            <div className="text-xs text-amber-500/70 mt-0.5">Email available (revealed on import)</div>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-400">{person.title || "\u2014"}</td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-white">{person.organization?.name || "\u2014"}</div>
                          {person.organization?.website_url && (
                            <div className="text-xs text-slate-500 mt-0.5">{person.organization.website_url}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-400">
                          {[person.city, person.state].filter(Boolean).join(", ") || "\u2014"}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-400">
                          {person.organization?.estimated_num_employees || "\u2014"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {(pagination.total_pages || 0) > 1 && (
            <div className="flex items-center justify-center gap-4">
              <button
                disabled={currentPage <= 1}
                onClick={() => handleSearch(currentPage - 1)}
                className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-1.5 text-sm text-white disabled:opacity-30 hover:bg-slate-700 transition"
              >
                Previous
              </button>
              <span className="text-sm text-slate-400">
                Page {currentPage} of {pagination.total_pages}
              </span>
              <button
                disabled={currentPage >= (pagination.total_pages || 1)}
                onClick={() => handleSearch(currentPage + 1)}
                className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-1.5 text-sm text-white disabled:opacity-30 hover:bg-slate-700 transition"
              >
                Next
              </button>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="py-12 text-center text-slate-400">Searching Apollo.io...</div>
          )}

          {/* Empty */}
          {results.length === 0 && !loading && (
            <div className="py-12 text-center">
              <p className="text-2xl mb-2">&#x1F50D;</p>
              <p className="text-white font-medium">Search for fitness retailers</p>
              <p className="text-sm text-slate-400 mt-1">
                Set your filters and click &ldquo;Search Apollo.io&rdquo; to find potential retail partners
              </p>
            </div>
          )}
        </div>

        {/* Outreach Modal */}
        {outreachPerson && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setOutreachPerson(null)}>
            <div className="w-full max-w-2xl rounded-xl border border-slate-700 bg-slate-800 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-slate-700 px-6 py-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">AI Outreach Email</h3>
                  <p className="text-sm text-slate-400">
                    For {outreachPerson.first_name} {outreachPerson.last_name} at{" "}
                    {outreachPerson.organization?.name}
                  </p>
                </div>
                <button onClick={() => setOutreachPerson(null)} className="text-slate-400 hover:text-white text-xl">
                  &times;
                </button>
              </div>
              <div className="p-6">
                {outreachLoading && (
                  <div className="py-8 text-center text-slate-400">Generating personalized email...</div>
                )}
                {outreachData && (
                  <div className="space-y-4">
                    {outreachData.subject && (
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Subject</label>
                        <div className="rounded-lg border border-slate-600 bg-slate-900 px-4 py-2 text-sm text-white">
                          {outreachData.subject}
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Email Body</label>
                      <div className="rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {outreachData.email}
                      </div>
                    </div>
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => handleOutreach(outreachPerson)}
                        className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition"
                      >
                        Regenerate
                      </button>
                      <button
                        onClick={handleCopy}
                        className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition"
                      >
                        {copied ? "Copied!" : "Copy Email"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
