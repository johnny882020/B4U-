import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BreakdownCard } from "@/components/evaluation/breakdown-card";
import type { WebsiteCriterionBreakdownItem } from "@/types/evaluation";

const SCORE_VARIANT = {
  strong: "success",
  adequate: "warning",
  weak: "destructive",
} as const;

export function CriteriaBreakdownList({ items }: { items: WebsiteCriterionBreakdownItem[] }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Criteria Breakdown</CardTitle>
          <CardDescription>
            A granular breakdown of what works, what&apos;s missing, and a concrete
            recommendation across the seven criteria an early-stage investor would scan for.
          </CardDescription>
        </CardHeader>
      </Card>
      <div className="space-y-3">
        {items.map((criterion) => (
          <BreakdownCard
            key={criterion.criterion}
            title={criterion.criterion}
            badge={
              <Badge variant={SCORE_VARIANT[criterion.score]} className="capitalize">
                {criterion.score}
              </Badge>
            }
            confidence={criterion.confidence}
            whatWorksLabel="What works"
            whatWorks={criterion.whatWorks}
            gapsLabel="Gaps"
            gaps={criterion.gaps}
            footerLabel="Recommendation"
            footerText={criterion.recommendation}
          />
        ))}
      </div>
    </div>
  );
}
