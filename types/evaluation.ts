export type ConfidenceLevel = "high" | "medium" | "low";

export interface EvaluationOverview {
  strengths: string[];
  criticalGaps: string[];
  readinessVerdict: string;
  confidenceLevel: ConfidenceLevel;
  confidenceRationale: string;
}

export interface ChecklistItem {
  id: string;
  item: string;
  priority?: "high" | "medium" | "low";
}

export interface DeckSlideBreakdownItem {
  slideNumber: number;
  slideTitle: string;
  whatWorks: string[];
  whatsMissing: string[];
  investorTakeaway: string;
  confidence: ConfidenceLevel;
}

export interface DeckEvaluationResult {
  overview: EvaluationOverview;
  slideBreakdown: DeckSlideBreakdownItem[];
  prepChecklist: ChecklistItem[];
}

export const WEBSITE_CRITERIA = [
  "Value Proposition Clarity",
  "Target Audience & Positioning",
  "Trust & Credibility Signals",
  "UX & Design Quality",
  "Conversion Path & CTA Clarity",
  "Technical Polish & Performance",
  "Competitive Differentiation",
] as const;

export type WebsiteCriterion = (typeof WEBSITE_CRITERIA)[number];

export interface WebsiteCriterionBreakdownItem {
  criterion: WebsiteCriterion;
  score: "strong" | "adequate" | "weak";
  whatWorks: string[];
  gaps: string[];
  recommendation: string;
  confidence: ConfidenceLevel;
}

export interface WebsiteEvaluationResult {
  overview: EvaluationOverview;
  criteriaBreakdown: WebsiteCriterionBreakdownItem[];
  actionChecklist: ChecklistItem[];
}

export const MAX_DECK_PAGES = 20;
