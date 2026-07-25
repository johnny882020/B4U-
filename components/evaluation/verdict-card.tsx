import { CheckCircle2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ConfidenceBadge } from "@/components/evaluation/confidence-badge";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import type { EvaluationOverview } from "@/types/evaluation";

export function VerdictCard({
  title,
  description,
  overview,
}: {
  title: string;
  description: string;
  overview: EvaluationOverview;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <ConfidenceBadge level={overview.confidenceLevel} />
            <InfoTooltip text={overview.confidenceRationale} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-success">
              <CheckCircle2 className="h-4 w-4" /> Strengths
            </h4>
            <ul className="space-y-1.5 text-sm text-foreground/90">
              {overview.strengths.map((s, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-success">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-warning">
              <AlertTriangle className="h-4 w-4" /> Critical gaps
            </h4>
            <ul className="space-y-1.5 text-sm text-foreground/90">
              {overview.criticalGaps.map((g, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-warning">•</span>
                  <span>{g}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <blockquote className="rounded-md border-l-4 border-accent bg-accent/5 px-4 py-3 text-sm leading-relaxed">
          {overview.readinessVerdict}
        </blockquote>
      </CardContent>
    </Card>
  );
}
