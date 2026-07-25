"use client";

import { useCallback } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { UrlInputForm } from "@/components/website-reviewer/url-input-form";
import { CriteriaBreakdownList } from "@/components/website-reviewer/criteria-breakdown-list";
import { VerdictCard } from "@/components/evaluation/verdict-card";
import { Checklist } from "@/components/evaluation/checklist";
import { DisclaimerBanner } from "@/components/evaluation/disclaimer-banner";
import { AnalyzingProgress } from "@/components/evaluation/analyzing-progress";
import { useEvaluationFlow } from "@/lib/hooks/use-evaluation-flow";
import type { WebsiteEvaluationResult } from "@/types/evaluation";

const ANALYZING_STEPS = [
  "Loading your website...",
  "Capturing screenshot...",
  "Analyzing value proposition...",
  "Evaluating investor-readiness signals...",
  "Finalizing recommendations...",
];

async function evaluateWebsite(url: string): Promise<WebsiteEvaluationResult> {
  const res = await fetch("/api/evaluate-website", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.error ?? "An error occurred during evaluation. Please try again.");
  }

  return json as WebsiteEvaluationResult;
}

export default function WebsiteReviewerPage() {
  const { state, start, reset } = useEvaluationFlow(evaluateWebsite);

  const handleSubmit = useCallback((url: string) => start(url), [start]);

  return (
    <div className="container max-w-3xl py-12">
      <div className="mb-8 space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">AI Investor Website Reviewer</h1>
        <p className="text-muted-foreground">
          See your website the way an early-stage investor would — enter your site URL and get
          structured, objective feedback on how to improve it.
        </p>
      </div>

      {state.status === "idle" && <UrlInputForm onSubmit={handleSubmit} />}

      {state.status === "analyzing" && (
        <AnalyzingProgress heading="Analyzing Your Website" steps={ANALYZING_STEPS} />
      )}

      {state.status === "error" && (
        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
          <Button variant="outline" onClick={reset}>
            <RotateCcw className="h-4 w-4" /> Back to input
          </Button>
        </div>
      )}

      {state.status === "results" && (
        <div className="space-y-6">
          <VerdictCard
            title="Evaluation Overview"
            description="A high-level overview of your website's strengths, critical gaps, and investor readiness."
            overview={state.result.overview}
          />
          <CriteriaBreakdownList items={state.result.criteriaBreakdown} />
          <Checklist
            title="Investor-Ready Action Checklist"
            description="Prioritized action items derived from the review to help you improve your site's investor readiness."
            helperText="Check off each item as you complete it."
            items={state.result.actionChecklist}
          />
          <DisclaimerBanner
            title="Investor lens"
            text="This review applies the same lens an early-stage investor uses when quickly scanning a startup's website — it is not a comprehensive design or SEO audit."
          />
          <Button variant="outline" onClick={reset}>
            <RotateCcw className="h-4 w-4" /> Review Another Website
          </Button>
        </div>
      )}
    </div>
  );
}
