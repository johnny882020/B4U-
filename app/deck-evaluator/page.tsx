"use client";

import { useCallback } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { DeckUploadDropzone } from "@/components/deck-evaluator/deck-upload-dropzone";
import { SlideBreakdownList } from "@/components/deck-evaluator/slide-breakdown-list";
import { VerdictCard } from "@/components/evaluation/verdict-card";
import { Checklist } from "@/components/evaluation/checklist";
import { DisclaimerBanner } from "@/components/evaluation/disclaimer-banner";
import { AnalyzingProgress } from "@/components/evaluation/analyzing-progress";
import { useEvaluationFlow } from "@/lib/hooks/use-evaluation-flow";
import { MAX_DECK_PAGES, type DeckEvaluationResult } from "@/types/evaluation";

const ANALYZING_STEPS = [
  "Uploading your deck...",
  "Analyzing deck structure...",
  "Evaluating content quality...",
  "Applying investor framework...",
  "Finalizing recommendations...",
];

async function evaluateDeck(file: File, signal: AbortSignal): Promise<DeckEvaluationResult> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/evaluate-deck", { method: "POST", body: formData, signal });

  // A platform-level failure (e.g. a proxy timeout) can return a plain-text
  // or HTML error page instead of the JSON our own route always returns —
  // parse defensively so that shows a clean message, not a raw parse error.
  const text = await res.text();
  let json: { error?: string } = {};
  try {
    json = JSON.parse(text);
  } catch {
    // fall through to the generic message below
  }

  if (!res.ok) {
    throw new Error(json.error ?? "An error occurred during evaluation. Please try again.");
  }

  return json as DeckEvaluationResult;
}

export default function DeckEvaluatorPage() {
  const { state, start, reset } = useEvaluationFlow(evaluateDeck);

  const handleSubmit = useCallback((file: File) => start(file), [start]);

  return (
    <div className="container max-w-3xl py-12">
      <div className="mb-8 space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Pitch Deck Evaluator</h1>
        <p className="text-muted-foreground">
          Get structured feedback on your pitch deck from an investor perspective — see your
          deck the way early-stage investors read it.
        </p>
      </div>

      {state.status === "idle" && <DeckUploadDropzone onSubmit={handleSubmit} />}

      {state.status === "analyzing" && (
        <AnalyzingProgress heading="Analyzing Your Deck" steps={ANALYZING_STEPS} />
      )}

      {state.status === "error" && (
        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
          <Button variant="outline" onClick={reset}>
            <RotateCcw className="h-4 w-4" /> Back to upload
          </Button>
        </div>
      )}

      {state.status === "results" && (
        <div className="space-y-6">
          <VerdictCard
            title="Evaluation Overview"
            description="A high-level overview of your early-stage pitch deck's strengths, critical gaps, and investment readiness."
            overview={state.result.overview}
          />
          <SlideBreakdownList items={state.result.slideBreakdown} />
          <Checklist
            title="Investor Meeting Preparation Checklist"
            description="Key action items derived from your deck analysis to help you prepare for early-stage investor conversations."
            helperText="Check off each item as you complete it to prepare for your investor meetings."
            items={state.result.prepChecklist}
          />
          <DisclaimerBanner
            title="Early stage fit"
            text={`All evaluation criteria and expectations are adapted for early-stage companies. Decks up to ${MAX_DECK_PAGES} slides are supported.`}
          />
          <Button variant="outline" onClick={reset}>
            <RotateCcw className="h-4 w-4" /> Evaluate Another
          </Button>
        </div>
      )}
    </div>
  );
}
