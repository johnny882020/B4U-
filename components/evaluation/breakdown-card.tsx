import type { ReactNode } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ConfidenceBadge } from "@/components/evaluation/confidence-badge";
import type { ConfidenceLevel } from "@/types/evaluation";

export function BreakdownCard({
  eyebrow,
  title,
  badge,
  confidence,
  whatWorksLabel,
  whatWorks,
  gapsLabel,
  gaps,
  footerLabel,
  footerText,
}: {
  eyebrow?: string;
  title: string;
  badge?: ReactNode;
  confidence: ConfidenceLevel;
  whatWorksLabel: string;
  whatWorks: string[];
  gapsLabel: string;
  gaps: string[];
  footerLabel: string;
  footerText: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            {eyebrow && (
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {eyebrow}
              </p>
            )}
            <h3 className="text-base font-semibold">{title}</h3>
          </div>
          <div className="flex items-center gap-1.5">
            {badge}
            <ConfidenceBadge level={confidence} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-success">
              {whatWorksLabel}
            </h4>
            {whatWorks.length > 0 ? (
              <ul className="space-y-1 text-sm">
                {whatWorks.map((w, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-success">•</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Nothing notable</p>
            )}
          </div>
          <div>
            <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-warning">
              {gapsLabel}
            </h4>
            {gaps.length > 0 ? (
              <ul className="space-y-1 text-sm">
                {gaps.map((g, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-warning">•</span>
                    <span>{g}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Nothing notable</p>
            )}
          </div>
        </div>
        <p className="rounded-md bg-accent/5 px-3 py-2 text-sm">
          <span className="font-semibold text-accent">{footerLabel}: </span>
          {footerText}
        </p>
      </CardContent>
    </Card>
  );
}
