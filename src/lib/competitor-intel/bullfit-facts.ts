// =============================================================================
// BullFit Facts — Static config used by AI for grounded recommendations
// =============================================================================
// IMPORTANT: Only these facts may be used for "How BullFit should position"
// recommendations. Do NOT add medical or disease claims.

import type { BullFitFacts } from "./types";

export const BULLFIT_FACTS: BullFitFacts = {
  brand_positioning: [
    "Premium sports nutrition brand focused on clean, transparent formulas",
    "Third-party tested and certified for banned substances",
    "Designed for serious athletes and fitness enthusiasts",
    "Transparent labeling — full disclosure of active ingredient doses",
    "Made in USA, GMP-certified facilities",
    "No proprietary blends — every ingredient fully dosed and disclosed",
  ],

  operational_readiness: [
    "98%+ OTIF (On-Time In-Full) delivery rate",
    "Case packs available for all retail SKUs",
    "EDI-capable for major retail partners",
    "Dedicated retail account management team",
    "Shelf-ready packaging and POS materials available",
    "30-day standard lead time for initial orders",
    "Flexible MOQs for independent retailers",
  ],

  allowed_claims: [
    // Only claims that are substantiated and approved for use.
    // Leave empty or add from internal claim library.
    // Do NOT add medical/disease claims here.
  ],

  product_skus: [
    {
      sku: "BF-PRE-001",
      name: "BullFit Pre-Workout Elite",
      category: "Pre-Workout",
      price: 44.99,
      servings: 30,
      price_per_serving: 1.50,
      key_messaging: [
        "Clinically dosed pre-workout formula",
        "300mg caffeine per serving",
        "Full transparent label",
        "Third-party tested",
      ],
    },
    {
      sku: "BF-PRO-001",
      name: "BullFit Whey Protein Isolate",
      category: "Protein",
      price: 54.99,
      servings: 25,
      price_per_serving: 2.20,
      key_messaging: [
        "25g protein per serving from whey isolate",
        "Low carb, low fat",
        "No artificial colors or flavors",
        "Informed Sport certified",
      ],
    },
    {
      sku: "BF-CRE-001",
      name: "BullFit Creatine Monohydrate",
      category: "Creatine",
      price: 29.99,
      servings: 60,
      price_per_serving: 0.50,
      key_messaging: [
        "Pure creatine monohydrate — no fillers",
        "5g per serving",
        "Unflavored and easily mixable",
        "Most researched sports supplement ingredient",
      ],
    },
    {
      sku: "BF-BCА-001",
      name: "BullFit BCAA Recovery",
      category: "Amino Acids",
      price: 34.99,
      servings: 30,
      price_per_serving: 1.17,
      key_messaging: [
        "2:1:1 BCAA ratio",
        "Added electrolytes for hydration",
        "Zero sugar, zero calories",
        "Designed for intra-workout and recovery",
      ],
    },
  ],
};

// Helper: look up a BullFit SKU by sku code or name substring
export function findBullFitSKU(query: string) {
  const q = query.toLowerCase();
  return BULLFIT_FACTS.product_skus.find(
    (s) =>
      s.sku.toLowerCase() === q ||
      s.name.toLowerCase().includes(q) ||
      s.category.toLowerCase() === q
  );
}
