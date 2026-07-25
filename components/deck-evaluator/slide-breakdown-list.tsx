import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BreakdownCard } from "@/components/evaluation/breakdown-card";
import type { DeckSlideBreakdownItem } from "@/types/evaluation";

export function SlideBreakdownList({ items }: { items: DeckSlideBreakdownItem[] }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Slide-by-Slide Breakdown</CardTitle>
          <CardDescription>
            A granular breakdown of what works, what&apos;s missing, and the early-stage investor
            takeaway for each slide of your pitch deck.
          </CardDescription>
        </CardHeader>
      </Card>
      <div className="space-y-3">
        {items.map((slide) => (
          <BreakdownCard
            key={slide.slideNumber}
            eyebrow={`Slide ${slide.slideNumber}`}
            title={slide.slideTitle}
            confidence={slide.confidence}
            whatWorksLabel="What works"
            whatWorks={slide.whatWorks}
            gapsLabel="What's missing"
            gaps={slide.whatsMissing}
            footerLabel="Investor takeaway"
            footerText={slide.investorTakeaway}
          />
        ))}
      </div>
    </div>
  );
}
