# B4U Pitch Pro

AI-powered feedback for solo founders, built by Base4u Solutions. Get structured,
investor-perspective feedback on your pitch deck and your website before real investors see
either one.

- **Pitch Deck Evaluator** — upload a PDF (up to 20 slides) and get an evaluation overview,
  a slide-by-slide breakdown, and an investor meeting prep checklist.
- **AI Investor Website Reviewer** — enter a URL and get a screenshot- and text-based review
  scored against seven objective early-stage-investor criteria.

Every result includes a confidence level reflecting how certain the analysis is, given what
could actually be extracted from the deck or the page.

This is an independent, unofficial tool. It recreates the logic and architecture of Grove
Ventures' Pitch Deck Evaluator (`deck-evaluator.grovevc.com`) in Base4u Solutions' own
visual identity — it is not affiliated with, endorsed by, or built on that product.

## Stack

- Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui-style components
- Google Gemini (`gemini-flash-latest`) via the Vercel AI SDK (`ai` + `@ai-sdk/google`),
  with structured JSON output validated against zod schemas
- `unpdf` for PDF text extraction
- `playwright-core` + `@sparticuz/chromium` for website screenshot and text capture

No auth, no database — every evaluation is a stateless, one-shot request.

## Getting started

```bash
npm install
cp .env.example .env.local   # set GOOGLE_GENERATIVE_AI_API_KEY
npm run dev
```

Open http://localhost:3000. `/deck-evaluator` and `/website-reviewer` are the two tools;
`/` is the landing page.

### Environment variables

| Variable | Required | Notes |
|---|---|---|
| `GOOGLE_GENERATIVE_AI_API_KEY` | Yes | Free key from [Google AI Studio](https://aistudio.google.com/apikey), no credit card required. |
| `PLAYWRIGHT_EXECUTABLE_PATH` | Outside Vercel only | Path to a local Chromium install (`npx playwright install chromium`). Not needed on Vercel — `@sparticuz/chromium` is used there automatically. |

## Deploying

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/johnny882020/B4U-)

Or manually: import this repo in the Vercel dashboard and deploy — Next.js is auto-detected.

Add `GOOGLE_GENERATIVE_AI_API_KEY` in **Project → Settings → Environment Variables** for the
Production environment, then redeploy (adding an environment variable doesn't retroactively
apply to an already-built deployment). Never paste a real key into a chat, a commit, or any
file in this repo — the Vercel dashboard is the only place it should go.

The website reviewer's function is configured for a longer duration (`maxDuration = 120`)
than the deck evaluator's (`60`), since launching headless Chromium and capturing a
screenshot takes longer than a text-only evaluation.

## Project structure

```
app/
  layout.tsx, page.tsx, globals.css, icon.tsx
  deck-evaluator/       # upload → analyzing → results
  website-reviewer/     # URL input → analyzing → results
  api/evaluate-deck/route.ts     # PDF → text extraction → Gemini → JSON
  api/evaluate-website/route.ts  # URL → Playwright capture → Gemini → JSON
components/
  shell/        # header, footer, logo
  ui/           # shadcn-style primitives
  evaluation/   # shared verdict card, checklist, progress, breakdown card
  deck-evaluator/, website-reviewer/   # tool-specific components
lib/
  ai.ts, pdf.ts, screenshot.ts, schemas.ts, utils.ts
  prompts/      # system prompts and user-content builders per tool
  hooks/        # shared idle | analyzing | results | error state machine
types/evaluation.ts
```
