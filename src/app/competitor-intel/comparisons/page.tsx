"use client";

import { useEffect, useState, useCallback } from "react";
import CompetitorIntelNav from "@/components/competitor-intel/CompetitorIntelNav";
import CitationLink from "@/components/competitor-intel/CitationLink";
import { getCompetitors, getSnapshots } from "@/lib/competitor-intel/api-client";
import { BULLFIT_FACTS, findBullFitSKU } from "@/lib/competitor-intel/bullfit-facts";
import type {
  CompetitorWithStats,
  SnapshotWithDetails,
  ExtractedData,
  BullFitSKU,
  Citation,
} from "@/lib/competitor-intel/types";

export default function ComparisonsPage() {
  const [competitors, setCompetitors] = useState<CompetitorWithStats[]>([]);
  const [snapshots, setSnapshots] = useState<SnapshotWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  // Selectors
  const [selectedSKU, setSelectedSKU] = useState<string>("");
  const [selectedCompetitor, setSelectedCompetitor] = useState<string>("");
  const [selectedSnapshot, setSelectedSnapshot] = useState<string>("");

  // Comparison data
  const [bullFitProduct, setBullFitProduct] = useState<BullFitSKU | null>(null);
  const [competitorData, setCompetitorData] = useState<ExtractedData | null>(null);
  const [competitorSnapshotId, setCompetitorSnapshotId] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const [comps] = await Promise.all([getCompetitors()]);
        setCompetitors(comps);
      } catch (err) {
        console.error("Failed to load comparisons data:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const loadCompetitorSnapshots = useCallback(async (competitorId: string) => {
    if (!competitorId) {
      setSnapshots([]);
      return;
    }
    try {
      const snaps = await getSnapshots({ competitor_id: competitorId });
      // Only show successful extractions
      setSnapshots(snaps.filter((s) => s.extraction_status === "success"));
    } catch (err) {
      console.error("Failed to load snapshots:", err);
    }
  }, []);

  useEffect(() => {
    if (selectedCompetitor) {
      loadCompetitorSnapshots(selectedCompetitor);
    }
  }, [selectedCompetitor, loadCompetitorSnapshots]);

  // When both sides are selected, compute comparison
  useEffect(() => {
    if (selectedSKU) {
      setBullFitProduct(findBullFitSKU(selectedSKU) || null);
    } else {
      setBullFitProduct(null);
    }
  }, [selectedSKU]);

  useEffect(() => {
    if (selectedSnapshot) {
      const snap = snapshots.find((s) => s.id === selectedSnapshot);
      if (snap) {
        setCompetitorData(snap.extracted_json);
        setCompetitorSnapshotId(snap.id);
      }
    } else {
      setCompetitorData(null);
      setCompetitorSnapshotId("");
    }
  }, [selectedSnapshot, snapshots]);

  const makeCitation = (fieldPath: string): Citation => ({
    snapshot_id: competitorSnapshotId,
    field_path: fieldPath,
  });

  const competitorName =
    competitors.find((c) => c.id === selectedCompetitor)?.name || "Competitor";

  const canCompare = bullFitProduct && competitorData;

  // Analysis helpers
  const getWinningPoints = (): Array<{ text: string; citation: Citation }> => {
    if (!canCompare) return [];
    const points: Array<{ text: string; citation: Citation }> = [];

    // Price advantage
    if (
      competitorData.price?.amount &&
      bullFitProduct.price < competitorData.price.amount
    ) {
      points.push({
        text: `BullFit ${bullFitProduct.name} is priced at $${bullFitProduct.price} vs ${competitorName}'s $${competitorData.price.amount}`,
        citation: makeCitation("price.amount"),
      });
    }

    // Price per serving advantage
    if (
      competitorData.price_per_serving &&
      bullFitProduct.price_per_serving < competitorData.price_per_serving
    ) {
      points.push({
        text: `Better value per serving: $${bullFitProduct.price_per_serving} vs $${competitorData.price_per_serving}`,
        citation: makeCitation("price_per_serving"),
      });
    }

    // More servings
    if (
      competitorData.servings &&
      bullFitProduct.servings > competitorData.servings
    ) {
      points.push({
        text: `More servings per container: ${bullFitProduct.servings} vs ${competitorData.servings}`,
        citation: makeCitation("servings"),
      });
    }

    return points;
  };

  const getVulnerabilities = (): Array<{ text: string; citation: Citation }> => {
    if (!canCompare) return [];
    const points: Array<{ text: string; citation: Citation }> = [];

    // Higher price
    if (
      competitorData.price?.amount &&
      bullFitProduct.price > competitorData.price.amount
    ) {
      points.push({
        text: `${competitorName} undercuts on price: $${competitorData.price.amount} vs BullFit's $${bullFitProduct.price}`,
        citation: makeCitation("price.amount"),
      });
    }

    // Active promotions
    if (competitorData.promo?.is_present) {
      points.push({
        text: `${competitorName} is running an active promotion: ${competitorData.promo.text || "details in snapshot"}`,
        citation: makeCitation("promo.text"),
      });
    }

    // Better reviews
    if (
      competitorData.reviews?.rating &&
      competitorData.reviews.rating >= 4.5
    ) {
      points.push({
        text: `Strong review presence: ${competitorData.reviews.rating}/5 from ${competitorData.reviews.count || "unknown"} reviews`,
        citation: makeCitation("reviews.rating"),
      });
    }

    // Lower shipping threshold
    if (
      competitorData.shipping_threshold?.amount &&
      competitorData.shipping_threshold.amount < 50
    ) {
      points.push({
        text: `Lower free shipping threshold: $${competitorData.shipping_threshold.amount}`,
        citation: makeCitation("shipping_threshold.amount"),
      });
    }

    return points;
  };

  const winning = getWinningPoints();
  const vulnerable = getVulnerabilities();

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6">
        <CompetitorIntelNav />
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-indigo-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Comparisons</h1>
        <p className="text-sm text-slate-400 mt-1">
          Side-by-side competitive comparison to inform retail positioning.
        </p>
      </div>

      <CompetitorIntelNav />

      {/* Selectors */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            BullFit Product
          </label>
          <select
            value={selectedSKU}
            onChange={(e) => setSelectedSKU(e.target.value)}
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="">Select a BullFit SKU</option>
            {BULLFIT_FACTS.product_skus.map((sku) => (
              <option key={sku.sku} value={sku.sku}>
                {sku.name} ({sku.sku})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Competitor
          </label>
          <select
            value={selectedCompetitor}
            onChange={(e) => {
              setSelectedCompetitor(e.target.value);
              setSelectedSnapshot("");
            }}
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="">Select a competitor</option>
            {competitors.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Competitor Source / Snapshot
          </label>
          <select
            value={selectedSnapshot}
            onChange={(e) => setSelectedSnapshot(e.target.value)}
            disabled={!selectedCompetitor}
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none disabled:opacity-50"
          >
            <option value="">Select a snapshot</option>
            {snapshots.map((s) => (
              <option key={s.id} value={s.id}>
                {(s.extracted_json?.product_name || s.source_type || "").replace(/_/g, " ")} —{" "}
                {new Date(s.fetched_at).toLocaleDateString()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {canCompare ? (
        <>
          {/* Comparison Table */}
          <div className="mb-8 overflow-hidden rounded-xl border border-slate-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-800/50">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-400">
                    Metric
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-indigo-400">
                    BullFit
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-amber-400">
                    {competitorName}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                <tr className="hover:bg-slate-800/30">
                  <td className="px-4 py-3 text-slate-400">Product</td>
                  <td className="px-4 py-3 text-white font-medium">{bullFitProduct.name}</td>
                  <td className="px-4 py-3 text-white">{competitorData.product_name || "Unknown"}</td>
                </tr>
                <tr className="hover:bg-slate-800/30">
                  <td className="px-4 py-3 text-slate-400">Price</td>
                  <td className="px-4 py-3 text-white font-medium">${bullFitProduct.price}</td>
                  <td className="px-4 py-3 text-white">
                    {competitorData.price?.amount ? `$${competitorData.price.amount}` : "Unknown"}
                  </td>
                </tr>
                <tr className="hover:bg-slate-800/30">
                  <td className="px-4 py-3 text-slate-400">Servings</td>
                  <td className="px-4 py-3 text-white">{bullFitProduct.servings}</td>
                  <td className="px-4 py-3 text-white">{competitorData.servings ?? "Unknown"}</td>
                </tr>
                <tr className="hover:bg-slate-800/30">
                  <td className="px-4 py-3 text-slate-400">Price/Serving</td>
                  <td className="px-4 py-3 text-white">${bullFitProduct.price_per_serving}</td>
                  <td className="px-4 py-3 text-white">
                    {competitorData.price_per_serving
                      ? `$${competitorData.price_per_serving}`
                      : "Unknown"}
                  </td>
                </tr>
                <tr className="hover:bg-slate-800/30">
                  <td className="px-4 py-3 text-slate-400">Promo Active</td>
                  <td className="px-4 py-3 text-slate-500">—</td>
                  <td className="px-4 py-3">
                    {competitorData.promo?.is_present ? (
                      <span className="text-amber-300">
                        Yes: {competitorData.promo.text?.slice(0, 60)}
                      </span>
                    ) : (
                      <span className="text-slate-500">None detected</span>
                    )}
                  </td>
                </tr>
                <tr className="hover:bg-slate-800/30">
                  <td className="px-4 py-3 text-slate-400">Key Messaging</td>
                  <td className="px-4 py-3">
                    <ul className="text-xs text-slate-300 space-y-1">
                      {bullFitProduct.key_messaging.map((m, i) => (
                        <li key={i}>• {m}</li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-4 py-3">
                    <ul className="text-xs text-slate-300 space-y-1">
                      {(competitorData.key_messaging || []).slice(0, 5).map((m, i) => (
                        <li key={i}>• {m}</li>
                      ))}
                      {(competitorData.key_messaging || []).length === 0 && (
                        <li className="text-slate-500">Not extracted</li>
                      )}
                    </ul>
                  </td>
                </tr>
                <tr className="hover:bg-slate-800/30">
                  <td className="px-4 py-3 text-slate-400">Claims Intensity</td>
                  <td className="px-4 py-3 text-slate-500">—</td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-white">
                      {(competitorData.claims_phrases || []).length} phrases
                    </span>
                    {(competitorData.claims_phrases || []).length > 3 && (
                      <span className="ml-2 rounded bg-amber-600/20 px-1.5 py-0.5 text-xs text-amber-300">
                        High
                      </span>
                    )}
                  </td>
                </tr>
                <tr className="hover:bg-slate-800/30">
                  <td className="px-4 py-3 text-slate-400">Shipping Threshold</td>
                  <td className="px-4 py-3 text-slate-500">—</td>
                  <td className="px-4 py-3 text-white">
                    {competitorData.shipping_threshold?.amount
                      ? `$${competitorData.shipping_threshold.amount}`
                      : "Unknown"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Analysis Panels */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* What they're winning on */}
            <div className="rounded-xl border border-red-600/20 bg-red-950/10 p-5">
              <h3 className="text-sm font-semibold text-red-300 mb-3">
                What They&apos;re Winning On
              </h3>
              {vulnerable.length > 0 ? (
                <ul className="space-y-3">
                  {vulnerable.map((v, i) => (
                    <li key={i} className="text-sm text-slate-300">
                      <span>• {v.text}</span>
                      <div className="mt-1">
                        <CitationLink citation={v.citation} index={i} />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">
                  No clear competitor advantages detected from available data.
                </p>
              )}
            </div>

            {/* What they're vulnerable on */}
            <div className="rounded-xl border border-green-600/20 bg-green-950/10 p-5">
              <h3 className="text-sm font-semibold text-green-300 mb-3">
                What They&apos;re Vulnerable On
              </h3>
              {winning.length > 0 ? (
                <ul className="space-y-3">
                  {winning.map((w, i) => (
                    <li key={i} className="text-sm text-slate-300">
                      <span>• {w.text}</span>
                      <div className="mt-1">
                        <CitationLink citation={w.citation} index={i} />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">
                  No clear vulnerabilities detected from available data.
                </p>
              )}
            </div>

            {/* How BullFit should position */}
            <div className="rounded-xl border border-indigo-600/20 bg-indigo-950/10 p-5">
              <h3 className="text-sm font-semibold text-indigo-300 mb-3">
                How BullFit Should Position
              </h3>
              <ul className="space-y-2">
                {BULLFIT_FACTS.brand_positioning.slice(0, 4).map((bp, i) => (
                  <li key={i} className="text-sm text-slate-300">
                    • {bp}
                  </li>
                ))}
                {BULLFIT_FACTS.operational_readiness.slice(0, 2).map((or, i) => (
                  <li key={`op-${i}`} className="text-sm text-slate-300">
                    • {or}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-slate-500 mt-3 italic">
                Based on BullFit facts — no external data used.
              </p>
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-700 p-12 text-center">
          <div className="text-4xl mb-3">⚖️</div>
          <h3 className="text-lg font-medium text-white mb-1">
            Select both sides to compare
          </h3>
          <p className="text-sm text-slate-400">
            Choose a BullFit product and a competitor snapshot to see a
            side-by-side comparison.
          </p>
        </div>
      )}
    </div>
  );
}
