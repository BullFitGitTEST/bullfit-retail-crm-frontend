// =============================================================================
// Centralized AI Service — all AI calls for Competitor Intel go through here
// =============================================================================
// No direct AI calls from UI components. All calls logged in competitor_runs.

import type {
  ExtractedData,
  InsightItem,
  RecommendationItem,
  Citation,
  DiffResult,
  DiscoverCompetitorsInput,
  DiscoverCompetitorsOutput,
} from "./types";
import { BULLFIT_FACTS } from "./bullfit-facts";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const AI_API_URL = process.env.AI_API_URL || "https://api.openai.com/v1/chat/completions";
const AI_API_KEY = process.env.AI_API_KEY || "";
const AI_MODEL = process.env.AI_MODEL || "gpt-4o";

const PROMPT_VERSIONS = {
  extraction: "v1.0.0",
  insight: "v1.0.0",
  recommendation: "v1.0.0",
  critic: "v1.0.0",
  discovery: "v1.0.0",
} as const;

export function getPromptVersion(type: keyof typeof PROMPT_VERSIONS): string {
  return PROMPT_VERSIONS[type];
}

// ---------------------------------------------------------------------------
// Generic AI call wrapper
// ---------------------------------------------------------------------------

interface AICallResult<T> {
  output: T;
  model: string;
  prompt_version: string;
  raw_response: unknown;
}

async function callAI<T>(
  systemPrompt: string,
  userPrompt: string,
  promptType: keyof typeof PROMPT_VERSIONS,
  options?: { temperature?: number }
): Promise<AICallResult<T>> {
  const response = await fetch(AI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: AI_MODEL,
      response_format: { type: "json_object" },
      temperature: options?.temperature ?? 0.1,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("AI API returned empty content");
  }

  const parsed = JSON.parse(content) as T;

  return {
    output: parsed,
    model: AI_MODEL,
    prompt_version: PROMPT_VERSIONS[promptType],
    raw_response: data,
  };
}

// ---------------------------------------------------------------------------
// 1) AI Extraction — normalize deterministic output + extract messaging
// ---------------------------------------------------------------------------

const EXTRACTION_SYSTEM_PROMPT = `You are a data extraction assistant for competitive intelligence in the sports nutrition / supplement retail industry.

Your job is to normalize and complete a structured data object from raw page text.

RULES:
- Output ONLY valid JSON matching the exact schema below.
- Never invent data. If a field cannot be found, use null.
- For arrays (key_messaging, claims_phrases), extract only phrases explicitly present in the text.
- Flag aggressive health claims in claims_phrases but do NOT generate medical/disease claims.
- detected_changes_hint: list any notable observations about the page (e.g., "new flavor announced", "price appears discounted").

Output schema:
{
  "product_name": "string|null",
  "price": {"amount": number|null, "currency": "USD"|null},
  "servings": number|null,
  "pack_size_text": "string|null",
  "price_per_serving": number|null,
  "promo": {"is_present": boolean, "text": "string|null"},
  "key_messaging": ["string"],
  "claims_phrases": ["string"],
  "shipping_threshold": {"amount": number|null, "currency": "USD"|null},
  "reviews": {"count": number|null, "rating": number|null},
  "detected_changes_hint": ["string"]
}`;

export async function aiExtract(
  rawText: string,
  deterministicPartial: Partial<ExtractedData>
): Promise<AICallResult<ExtractedData>> {
  const userPrompt = `Here is the raw page text (truncated to 15000 chars):
---
${rawText.slice(0, 15000)}
---

Here is what deterministic extraction found (use as hints, override if AI finds better data):
${JSON.stringify(deterministicPartial, null, 2)}

Extract the structured data. Return ONLY the JSON object.`;

  return callAI<ExtractedData>(EXTRACTION_SYSTEM_PROMPT, userPrompt, "extraction");
}

// ---------------------------------------------------------------------------
// 2) AI Insight Generation — weekly per-competitor insights
// ---------------------------------------------------------------------------

const INSIGHT_SYSTEM_PROMPT = `You are a competitive intelligence analyst for BullFit, a sports nutrition brand entering retail.

Given a set of diffs (changes detected across competitor sources in the last 7 days), produce a weekly insight report.

RULES:
- Every statement MUST be backed by citations referencing specific snapshot_ids and field_paths.
- Never invent numbers or facts. If data is missing, say "unknown" and suggest how to verify.
- Do not claim competitor retail placements unless explicitly captured.
- Do not generate medical or disease claims. Flag aggressive claims as "risk".
- Output ONLY valid JSON matching this schema:

{
  "summary": "string (2-4 sentences overview)",
  "opportunities": [
    {
      "title": "string",
      "why_it_matters": "string (1-2 sentences)",
      "citations": [{"snapshot_id": "uuid", "field_path": "string"}]
    }
  ],
  "threats": [
    {
      "title": "string",
      "why_it_matters": "string (1-2 sentences)",
      "citations": [{"snapshot_id": "uuid", "field_path": "string"}]
    }
  ]
}

Return 2-5 opportunities and 1-4 threats. Every item MUST have at least one citation.`;

interface InsightInput {
  competitor_name: string;
  competitor_id: string;
  diffs: Array<{
    diff_id: string;
    source_url: string;
    source_type: string;
    from_snapshot_id: string;
    to_snapshot_id: string;
    diff_json: DiffResult;
    to_extracted_json: ExtractedData;
  }>;
}

interface InsightOutput {
  summary: string;
  opportunities: InsightItem[];
  threats: InsightItem[];
}

export async function aiGenerateInsights(
  input: InsightInput
): Promise<AICallResult<InsightOutput>> {
  const userPrompt = `Competitor: ${input.competitor_name} (ID: ${input.competitor_id})

Diffs from the last 7 days:
${JSON.stringify(input.diffs, null, 2)}

Generate the weekly insight report. Return ONLY JSON.`;

  return callAI<InsightOutput>(INSIGHT_SYSTEM_PROMPT, userPrompt, "insight");
}

// ---------------------------------------------------------------------------
// 3) AI Recommendation Generation
// ---------------------------------------------------------------------------

const RECOMMENDATION_SYSTEM_PROMPT = `You are a retail growth strategist for BullFit, a sports nutrition brand.

Given a weekly insight report (opportunities + threats) and BullFit's facts, generate 3-7 actionable recommendations.

RULES:
- Each recommendation MUST be grounded in evidence from the insight report.
- Each recommendation MUST have citations referencing snapshot_ids.
- action_type must be one of: update_pitch, update_template, update_sequence, update_pricing_sheet, create_one_pager, add_objection_response
- expected_impact: high, medium, or low
- task_payload.due_offset_days default to 3
- Never invent facts. Use only BullFit facts provided.
- Do not generate medical claims.
- "How BullFit should position" must reference only BullFit facts below.

BullFit Facts:
${JSON.stringify(BULLFIT_FACTS, null, 2)}

Output ONLY valid JSON matching this schema:
{
  "recommendations": [
    {
      "title": "string",
      "action_type": "string",
      "why_it_matters": "string",
      "expected_impact": "high|medium|low",
      "task_payload": {
        "title": "string",
        "description": "string",
        "due_offset_days": 3,
        "metadata": {
          "competitor_id": "uuid",
          "insight_id": "uuid",
          "citations": [{"snapshot_id":"uuid","field_path":"string"}]
        }
      },
      "citations": [{"snapshot_id":"uuid","field_path":"string"}]
    }
  ]
}`;

interface RecommendationInput {
  competitor_id: string;
  competitor_name: string;
  insight_id: string;
  summary: string;
  opportunities: InsightItem[];
  threats: InsightItem[];
  all_citations: Citation[];
}

interface RecommendationOutput {
  recommendations: RecommendationItem[];
}

export async function aiGenerateRecommendations(
  input: RecommendationInput
): Promise<AICallResult<RecommendationOutput>> {
  const userPrompt = `Competitor: ${input.competitor_name} (ID: ${input.competitor_id})
Insight ID: ${input.insight_id}

Weekly Summary:
${input.summary}

Opportunities:
${JSON.stringify(input.opportunities, null, 2)}

Threats:
${JSON.stringify(input.threats, null, 2)}

All available citations:
${JSON.stringify(input.all_citations, null, 2)}

Generate 3-7 actionable recommendations. Return ONLY JSON.`;

  return callAI<RecommendationOutput>(
    RECOMMENDATION_SYSTEM_PROMPT,
    userPrompt,
    "recommendation"
  );
}

// ---------------------------------------------------------------------------
// 4) AI Critic — validate AI output for unsupported claims
// ---------------------------------------------------------------------------

const CRITIC_SYSTEM_PROMPT = `You are a compliance reviewer. Your job is to check AI-generated competitive intelligence for unsupported claims.

RULES:
- Check that every factual statement is backed by a citation.
- Check that no medical/disease claims are present.
- Check that no defamatory language is used.
- Do NOT introduce new facts or information.
- Output ONLY valid JSON:

{
  "flags": [
    {
      "type": "unsupported_claim|medical_claim|defamatory|missing_citation",
      "message": "string",
      "field_path": "string (optional)"
    }
  ],
  "passed": boolean
}

If everything is compliant, return {"flags": [], "passed": true}.`;

interface CriticOutput {
  flags: Array<{
    type: string;
    message: string;
    field_path?: string;
  }>;
  passed: boolean;
}

export async function aiCriticReview(
  content: Record<string, unknown>
): Promise<AICallResult<CriticOutput>> {
  const userPrompt = `Review this AI-generated competitive intelligence output for compliance:

${JSON.stringify(content, null, 2)}

Check for unsupported claims, medical language, and defamatory content. Return ONLY JSON.`;

  return callAI<CriticOutput>(CRITIC_SYSTEM_PROMPT, userPrompt, "critic");
}

// ---------------------------------------------------------------------------
// 5) AI Competitor Discovery — suggest competitors based on BullFit's portfolio
// ---------------------------------------------------------------------------

const DISCOVERY_SYSTEM_PROMPT = `You are a competitive intelligence research assistant specializing in the sports nutrition and dietary supplement industry.

Given BullFit's product portfolio and market positioning, suggest direct and adjacent competitors that a retail sales team should monitor.

RULES:
- Output ONLY valid JSON matching the schema below.
- Each suggestion MUST be a real, publicly known brand in sports nutrition / supplements.
- Do NOT invent fictional companies.
- suggested_tags MUST come from this list: Pre-Workout, Protein, Creatine, Amino Acids, Fat Burner, Vitamins, Hydration, Energy, Mass Gainer, Greens
- overlap_categories should indicate which of BullFit's product categories this competitor directly competes in.
- For suggested_sources, only include URLs you are highly confident are real (e.g., the brand's main domain + typical paths like /products or /collections). Use source_type values from: website_pdp, website_collection, pricing_page, amazon_listing, instagram, tiktok, press.
- reasoning must explain WHY this brand is a relevant competitor (positioning overlap, price point, retail presence, etc.)
- Do NOT include BullFit itself.
- Prioritize brands that compete in the same retail channels (GNC, specialty retail, Amazon).
- suggested_priority: "high" for direct competitors in the same categories at similar price points, "medium" for adjacent or partial overlap, "low" for aspirational/watchlist brands.
- Do NOT generate medical or disease claims in any text field.

Output schema:
{
  "market_context": "string (2-3 sentences summarizing the competitive landscape)",
  "suggestions": [
    {
      "name": "string",
      "website_url": "string",
      "suggested_tags": ["string"],
      "suggested_priority": "high|medium|low",
      "reasoning": "string (1-2 sentences)",
      "overlap_categories": ["string"],
      "suggested_sources": [
        {
          "url": "string",
          "source_type": "string",
          "label": "string"
        }
      ]
    }
  ]
}`;

const TAG_OPTIONS = [
  "Pre-Workout", "Protein", "Creatine", "Amino Acids", "Fat Burner",
  "Vitamins", "Hydration", "Energy", "Mass Gainer", "Greens",
];

export async function aiDiscoverCompetitors(
  input: DiscoverCompetitorsInput
): Promise<AICallResult<DiscoverCompetitorsOutput>> {
  const userPrompt = `BullFit Product Portfolio & Positioning:
${JSON.stringify(BULLFIT_FACTS, null, 2)}

Already tracked competitors (exclude these from suggestions):
${JSON.stringify(input.exclude_names || [], null, 2)}

${input.focus_context ? `User focus: ${input.focus_context}` : "Suggest a general competitive landscape scan across all BullFit product categories."}
${input.category_filter?.length ? `Focus on these categories: ${input.category_filter.join(", ")}` : ""}

Suggest up to ${input.max_suggestions || 8} competitors. Return ONLY JSON.`;

  const result = await callAI<DiscoverCompetitorsOutput>(
    DISCOVERY_SYSTEM_PROMPT,
    userPrompt,
    "discovery",
    { temperature: 0.4 }
  );

  // Normalize tags to match TAG_OPTIONS casing
  const tagSet = new Set(TAG_OPTIONS.map((t) => t.toLowerCase()));
  result.output.suggestions = result.output.suggestions.map((s) => ({
    ...s,
    suggested_tags: s.suggested_tags
      .map((t) => TAG_OPTIONS.find((opt) => opt.toLowerCase() === t.toLowerCase()) || t)
      .filter((t) => tagSet.has(t.toLowerCase())),
  }));

  return result;
}
