import { z } from "zod";
import { WEBSITE_CRITERIA } from "@/types/evaluation";

const confidenceLevelSchema = z.enum(["high", "medium", "low"]);

const overviewSchema = z.object({
  strengths: z.array(z.string()).min(1),
  criticalGaps: z.array(z.string()).min(1),
  readinessVerdict: z.string().min(1),
  confidenceLevel: confidenceLevelSchema,
  confidenceRationale: z.string().min(1),
});

const checklistItemSchema = z.object({
  id: z.string().min(1),
  item: z.string().min(1),
});

const checklistItemWithPrioritySchema = checklistItemSchema.extend({
  priority: z.enum(["high", "medium", "low"]),
});

export const deckEvaluationResultSchema = z.object({
  overview: overviewSchema,
  slideBreakdown: z
    .array(
      z.object({
        slideNumber: z.number().int().positive(),
        slideTitle: z.string().min(1),
        whatWorks: z.array(z.string()),
        whatsMissing: z.array(z.string()),
        investorTakeaway: z.string().min(1),
        confidence: confidenceLevelSchema,
      }),
    )
    .min(1),
  prepChecklist: z.array(checklistItemSchema).min(1),
});

export const websiteEvaluationResultSchema = z.object({
  overview: overviewSchema,
  criteriaBreakdown: z
    .array(
      z.object({
        criterion: z.enum(WEBSITE_CRITERIA),
        score: z.enum(["strong", "adequate", "weak"]),
        whatWorks: z.array(z.string()),
        gaps: z.array(z.string()),
        recommendation: z.string().min(1),
        confidence: confidenceLevelSchema,
      }),
    )
    .min(1),
  actionChecklist: z.array(checklistItemWithPrioritySchema).min(1),
});
