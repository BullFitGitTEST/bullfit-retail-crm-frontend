// =============================================================================
// Deterministic extraction — regex/heuristic extraction from raw text
// =============================================================================

import type { ExtractedData } from "./types";

/** Blank extracted data template */
export function emptyExtractedData(): ExtractedData {
  return {
    product_name: null,
    price: { amount: null, currency: null },
    servings: null,
    pack_size_text: null,
    price_per_serving: null,
    promo: { is_present: false, text: null },
    key_messaging: [],
    claims_phrases: [],
    shipping_threshold: { amount: null, currency: null },
    reviews: { count: null, rating: null },
    detected_changes_hint: [],
  };
}

// ---------------------------------------------------------------------------
// Price patterns
// ---------------------------------------------------------------------------

const PRICE_PATTERNS = [
  /\$\s?(\d{1,4}(?:\.\d{2})?)/g,
  /USD\s?(\d{1,4}(?:\.\d{2})?)/gi,
  /price[:\s]*\$?\s?(\d{1,4}(?:\.\d{2})?)/gi,
  /(?:sale|now|our price)[:\s]*\$?\s?(\d{1,4}(?:\.\d{2})?)/gi,
];

export function extractPrices(text: string): number[] {
  const prices: number[] = [];
  for (const pattern of PRICE_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const val = parseFloat(match[1]);
      if (val > 0 && val < 10000) {
        prices.push(val);
      }
    }
  }
  return [...new Set(prices)].sort((a, b) => a - b);
}

// ---------------------------------------------------------------------------
// Servings patterns
// ---------------------------------------------------------------------------

const SERVINGS_PATTERNS = [
  /(\d{1,4})\s*servings?/gi,
  /servings?[:\s]*(\d{1,4})/gi,
  /serving size.*?(\d{1,4})\s*servings?/gi,
  /(\d{1,4})\s*scoops?/gi,
  /(\d{1,4})\s*doses?/gi,
];

export function extractServings(text: string): number | null {
  for (const pattern of SERVINGS_PATTERNS) {
    pattern.lastIndex = 0;
    const match = pattern.exec(text);
    if (match) {
      const val = parseInt(match[1], 10);
      if (val > 0 && val < 1000) return val;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Shipping threshold
// ---------------------------------------------------------------------------

const SHIPPING_PATTERNS = [
  /free\s+shipping\s+(?:on\s+)?(?:orders?\s+)?(?:over|above|\$)\s*\$?\s*(\d{1,4}(?:\.\d{2})?)/gi,
  /\$(\d{1,4}(?:\.\d{2})?)\s*(?:for\s+)?free\s+shipping/gi,
  /shipping\s+free\s+over\s+\$?(\d{1,4}(?:\.\d{2})?)/gi,
];

export function extractShippingThreshold(text: string): number | null {
  for (const pattern of SHIPPING_PATTERNS) {
    pattern.lastIndex = 0;
    const match = pattern.exec(text);
    if (match) {
      const val = parseFloat(match[1]);
      if (val > 0 && val < 10000) return val;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Promo detection
// ---------------------------------------------------------------------------

const PROMO_KEYWORDS = [
  "sale",
  "% off",
  "percent off",
  "free shipping",
  "bogo",
  "buy one get one",
  "discount",
  "coupon",
  "limited time",
  "flash sale",
  "clearance",
  "save $",
  "save up to",
  "use code",
  "promo code",
];

const PROMO_PATTERNS = [
  /(?:save|get)\s+(\d{1,3})%\s*off/gi,
  /(\d{1,3})%\s*off/gi,
  /use\s+code\s+([A-Z0-9]+)/gi,
  /buy\s+\d+\s+get\s+\d+/gi,
  /free\s+(?:gift|sample|shipping)/gi,
];

export function extractPromo(text: string): { is_present: boolean; text: string | null } {
  const lowerText = text.toLowerCase();

  // Check keywords
  for (const keyword of PROMO_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      // Try to extract the surrounding promo sentence
      const idx = lowerText.indexOf(keyword);
      const start = Math.max(0, text.lastIndexOf(".", idx) + 1);
      const end = text.indexOf(".", idx + keyword.length);
      const promoText = text.slice(start, end > 0 ? end + 1 : start + 200).trim();
      return { is_present: true, text: promoText.slice(0, 500) };
    }
  }

  // Check regex patterns
  for (const pattern of PROMO_PATTERNS) {
    pattern.lastIndex = 0;
    const match = pattern.exec(text);
    if (match) {
      return { is_present: true, text: match[0].trim() };
    }
  }

  return { is_present: false, text: null };
}

// ---------------------------------------------------------------------------
// Reviews extraction
// ---------------------------------------------------------------------------

const REVIEW_COUNT_PATTERNS = [
  /(\d[\d,]*)\s*(?:reviews?|ratings?|customer reviews?)/gi,
  /(?:based on|from)\s+(\d[\d,]*)\s*(?:reviews?|ratings?)/gi,
];

const RATING_PATTERNS = [
  /(\d(?:\.\d)?)\s*(?:out of\s*5|\/\s*5|stars?)/gi,
  /rating[:\s]*(\d(?:\.\d)?)/gi,
  /(\d(?:\.\d)?)\s*(?:star|★)/gi,
];

export function extractReviews(text: string): { count: number | null; rating: number | null } {
  let count: number | null = null;
  let rating: number | null = null;

  for (const pattern of REVIEW_COUNT_PATTERNS) {
    pattern.lastIndex = 0;
    const match = pattern.exec(text);
    if (match) {
      count = parseInt(match[1].replace(/,/g, ""), 10);
      break;
    }
  }

  for (const pattern of RATING_PATTERNS) {
    pattern.lastIndex = 0;
    const match = pattern.exec(text);
    if (match) {
      const val = parseFloat(match[1]);
      if (val >= 0 && val <= 5) {
        rating = val;
        break;
      }
    }
  }

  return { count, rating };
}

// ---------------------------------------------------------------------------
// Strip HTML tags to plain text
// ---------------------------------------------------------------------------

export function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

// ---------------------------------------------------------------------------
// Main deterministic extraction pipeline
// ---------------------------------------------------------------------------

export function deterministicExtract(rawText: string): Partial<ExtractedData> {
  const text = rawText.slice(0, 100_000); // safety cap

  const prices = extractPrices(text);
  const servings = extractServings(text);
  const shipping = extractShippingThreshold(text);
  const promo = extractPromo(text);
  const reviews = extractReviews(text);

  // Best guess at main product price (first reasonable price)
  const primaryPrice = prices.length > 0 ? prices[0] : null;

  const pricePerServing =
    primaryPrice !== null && servings !== null && servings > 0
      ? Math.round((primaryPrice / servings) * 100) / 100
      : null;

  return {
    price: { amount: primaryPrice, currency: primaryPrice !== null ? "USD" : null },
    servings,
    price_per_serving: pricePerServing,
    promo,
    shipping_threshold: {
      amount: shipping,
      currency: shipping !== null ? "USD" : null,
    },
    reviews,
  };
}

// ---------------------------------------------------------------------------
// Compute content hash for dedup
// ---------------------------------------------------------------------------

export async function computeContentHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
