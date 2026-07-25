import Link from "next/link";
import { FileText, Globe, Upload, Sparkles, ClipboardList, ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const HOW_IT_WORKS = [
  {
    icon: Upload,
    title: "Upload or enter a URL",
    description: "Share your pitch deck PDF or your website address.",
  },
  {
    icon: Sparkles,
    title: "AI analysis",
    description: "Our AI reviews it the way an early-stage investor would — objectively, against a fixed framework.",
  },
  {
    icon: ClipboardList,
    title: "Structured feedback",
    description: "Strengths, gaps, a readiness verdict, and a prioritized action checklist.",
  },
];

export default function HomePage() {
  return (
    <div className="container max-w-5xl py-16">
      <section className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Get structured, investor-perspective feedback — before investors see it.
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          B4U Pitch Pro gives solo founders a professional, objective read on their pitch deck
          and their website, using the same lens an early-stage investor would.
        </p>
      </section>

      <section className="mt-14 grid gap-6 sm:grid-cols-2">
        <Card className="flex flex-col transition-shadow hover:shadow-md">
          <CardHeader>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/5">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="mt-2">Pitch Deck Evaluator</CardTitle>
            <CardDescription>
              Upload your pitch deck and get a slide-by-slide breakdown, an investment-readiness
              verdict, and a prep checklist for your next investor meeting.
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto">
            <Link href="/deck-evaluator" className={cn(buttonVariants(), "w-full")}>
              Evaluate Your Deck <ArrowRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>

        <Card className="flex flex-col transition-shadow hover:shadow-md">
          <CardHeader>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/5">
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="mt-2">AI Investor Website Reviewer</CardTitle>
            <CardDescription>
              Enter your site URL and see it the way an investor would — value proposition,
              trust signals, UX, conversion clarity, and more, scored against objective criteria.
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto">
            <Link href="/website-reviewer" className={cn(buttonVariants(), "w-full")}>
              Review Your Website <ArrowRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      </section>

      <section className="mt-20">
        <h2 className="text-center text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          How it works
        </h2>
        <div className="mt-6 grid gap-8 sm:grid-cols-3">
          {HOW_IT_WORKS.map((step, i) => (
            <div key={i} className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                <step.icon className="h-6 w-6 text-accent" />
              </div>
              <h3 className="mt-3 font-semibold">{step.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
