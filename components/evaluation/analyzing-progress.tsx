"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const STEP_FADE_MS = 150;
const LONG_WAIT_MS = 15000;

export function AnalyzingProgress({
  heading,
  steps,
}: {
  heading: string;
  steps: string[];
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [stepVisible, setStepVisible] = useState(true);
  const [longWait, setLongWait] = useState(false);

  useEffect(() => {
    if (stepIndex >= steps.length - 1) return;
    // Front-loaded pacing: faster early, slower toward the end, so it rarely
    // finishes before the real request resolves.
    const delay = 1200 + stepIndex * 700;
    const advanceTimer = setTimeout(() => {
      setStepVisible(false);
      const fadeTimer = setTimeout(() => {
        setStepIndex((i) => Math.min(i + 1, steps.length - 1));
        setStepVisible(true);
      }, STEP_FADE_MS);
      return () => clearTimeout(fadeTimer);
    }, delay);
    return () => clearTimeout(advanceTimer);
  }, [stepIndex, steps.length]);

  useEffect(() => {
    const timer = setTimeout(() => setLongWait(true), LONG_WAIT_MS);
    return () => clearTimeout(timer);
  }, []);

  const progressPercent = ((stepIndex + 1) / steps.length) * 100;

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-6 py-12 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
        <div>
          <h2 className="text-xl font-semibold">{heading}</h2>
          <p
            className={cn(
              "mt-2 text-sm text-muted-foreground transition-opacity duration-150",
              stepVisible ? "opacity-100" : "opacity-0",
            )}
          >
            {steps[stepIndex]}
          </p>
        </div>
        <Progress value={progressPercent} className="w-full max-w-sm" />
        {longWait && (
          <p className="text-xs text-muted-foreground">
            Complex decks and sites can take up to a minute — thanks for your patience.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
