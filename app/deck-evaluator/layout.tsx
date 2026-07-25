import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pitch Deck Evaluator — B4U Pitch Pro",
  description:
    "Upload your pitch deck and get a slide-by-slide breakdown, an investment-readiness verdict, and a prep checklist from an early-stage investor's perspective.",
};

export default function DeckEvaluatorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
