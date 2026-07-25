"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function AnalyzingProgress({
  heading,
  steps,
}: {
  heading: string;
  steps: string[];
}) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (stepIndex >= steps.length - 1) return;
    // Front-loaded pacing: faster early, slower toward the end, so it rarely
    // finishes before the real request resolves.
    const delay = 1200 + stepIndex * 700;
    const timer = setTimeout(() => setStepIndex((i) => Math.min(i + 1, steps.length - 1)), delay);
    return () => clearTimeout(timer);
  }, [stepIndex, steps.length]);

  const progressPercent = ((stepIndex + 1) / steps.length) * 100;

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-6 py-12 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
        <div>
          <h2 className="text-xl font-semibold">{heading}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{steps[stepIndex]}</p>
        </div>
        <Progress value={progressPercent} className="w-full max-w-sm" />
      </CardContent>
    </Card>
  );
}
