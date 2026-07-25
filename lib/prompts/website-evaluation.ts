import { WEBSITE_CRITERIA } from "@/types/evaluation";

export const WEBSITE_EVALUATION_SYSTEM_PROMPT = `You are an early-stage investor quickly scanning a founder's website the way you would during initial diligence — you have a screenshot of the page and its extracted text/metadata, and a few minutes to form a view.

Evaluate the site against exactly these seven objective criteria: ${WEBSITE_CRITERIA.join(", ")}.

For each criterion, decide a score of "strong", "adequate", or "weak", list what works, list the gaps, and give one concrete, actionable recommendation for improving it. Then produce:

1. An overview: overall strengths, critical gaps, and a concise investment-readiness-style verdict on how the site would land with an early-stage investor doing a first pass (2-4 sentences).
2. The full seven-criterion breakdown described above.
3. A prioritized action checklist: specific, concrete items derived from the gaps (each tagged high/medium/low priority) that the founder should fix, ordered so the founder knows what to address first.

For every section, also report a confidence level (high/medium/low) reflecting how certain your analysis is given the quality and completeness of the captured screenshot and extracted text — NOT how good or bad the website itself is. If the page appears to have failed to fully load, has very little visible content, or a criterion has little visible evidence either way, lower your confidence on that basis and say so in the confidence rationale.

Ground every claim in what is actually visible in the screenshot or present in the extracted text. Do not invent facts about the company, its team, its traction, or its customers that aren't visibly supported.`;

export function buildWebsiteEvaluationTextContent(opts: {
  url: string;
  title: string | null;
  metaDescription: string | null;
  ogTitle: string | null;
  headings: string[];
  ctaTexts: string[];
  visibleText: string;
  loadWarning?: string;
}): string {
  const parts = [
    `URL: ${opts.url}`,
    opts.title ? `Page title: ${opts.title}` : null,
    opts.metaDescription ? `Meta description: ${opts.metaDescription}` : null,
    opts.ogTitle ? `OG title: ${opts.ogTitle}` : null,
    opts.headings.length
      ? `Headings (H1/H2, in order):\n${opts.headings.map((h) => `- ${h}`).join("\n")}`
      : null,
    opts.ctaTexts.length
      ? `Button/link text found on the page:\n${opts.ctaTexts.map((c) => `- ${c}`).join("\n")}`
      : null,
    opts.loadWarning ? `Note: ${opts.loadWarning}` : null,
    `Visible page text (truncated):\n${opts.visibleText}`,
  ].filter(Boolean);

  return parts.join("\n\n");
}

export const websiteEvaluationJsonSchema = {
  type: "object",
  properties: {
    overview: {
      type: "object",
      properties: {
        strengths: { type: "array", items: { type: "string" } },
        criticalGaps: { type: "array", items: { type: "string" } },
        readinessVerdict: { type: "string" },
        confidenceLevel: { type: "string", enum: ["high", "medium", "low"] },
        confidenceRationale: { type: "string" },
      },
      required: [
        "strengths",
        "criticalGaps",
        "readinessVerdict",
        "confidenceLevel",
        "confidenceRationale",
      ],
      additionalProperties: false,
    },
    criteriaBreakdown: {
      type: "array",
      items: {
        type: "object",
        properties: {
          criterion: { type: "string", enum: WEBSITE_CRITERIA },
          score: { type: "string", enum: ["strong", "adequate", "weak"] },
          whatWorks: { type: "array", items: { type: "string" } },
          gaps: { type: "array", items: { type: "string" } },
          recommendation: { type: "string" },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
        },
        required: [
          "criterion",
          "score",
          "whatWorks",
          "gaps",
          "recommendation",
          "confidence",
        ],
        additionalProperties: false,
      },
    },
    actionChecklist: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          item: { type: "string" },
          priority: { type: "string", enum: ["high", "medium", "low"] },
        },
        required: ["id", "item", "priority"],
        additionalProperties: false,
      },
    },
  },
  required: ["overview", "criteriaBreakdown", "actionChecklist"],
  additionalProperties: false,
} as const;
