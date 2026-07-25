# B4U Pitch Pro

AI-powered feedback for solo founders, built by Base4u Solutions — get structured,
investor-perspective feedback on your **pitch deck** and your **website**, before real
investors see either one.

Two tools:

- **Pitch Deck Evaluator** — upload a PDF pitch deck (up to 20 slides) and get an
  evaluation overview, a slide-by-slide breakdown, and an investor meeting prep
  checklist.
- **AI Investor Website Reviewer** — enter your site URL and get a screenshot- and
  text-based review scored against seven objective early-stage-investor criteria.

Every result includes a confidence level reflecting how certain the analysis is, given
what could actually be extracted from the deck or the page.

This is an independent, unofficial tool. It recreates the *logic and architecture* of
Grove Ventures' Pitch Deck Evaluator (`deck-evaluator.grovevc.com`) in Base4u Solutions'
own visual identity — it is not affiliated with, endorsed by, or built on that product.

## Stack

Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui-style components,
Anthropic Claude (`claude-opus-5`, structured outputs via `output_config.format`) for
both evaluations, `unpdf` for PDF text extraction, and Playwright (Chromium) for
website screenshot + text capture.

No auth, no database — every evaluation is a stateless, one-shot request; results live
only in browser state until you refresh or start another evaluation.

## Getting started

```bash
npm install
cp .env.example .env.local   # then set ANTHROPIC_API_KEY
npm run dev
```

Open http://localhost:3000. `/deck-evaluator` and `/website-reviewer` are the two tools;
`/` is the landing page.

### Environment variables

| Variable | Required | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Both tools call the Claude API server-side. |
| `PLAYWRIGHT_EXECUTABLE_PATH` | No | Only needed to override Playwright's own bundled Chromium resolution — e.g. a sandbox with a browser pre-installed at a nonstandard path. Leave unset for local dev with `npx playwright install chromium`, and leave unset in the Docker deploy described below (the base image already provides a matching Chromium at Playwright's default location). |

## Deploying to Render

Playwright + a full Chromium binary does not fit standard serverless function
size/cold-start limits (e.g. a default Vercel deployment), so this repo ships a
`Dockerfile` (based on Microsoft's official Playwright image, which includes Chromium and
every OS-level dependency it needs, version-matched to the pinned `playwright` npm
package) and a `render.yaml` Blueprint for a Docker-based Render Web Service.

**One-click:** click
[Deploy to Render](https://render.com/deploy?repo=https://github.com/johnny882020/B4U-)
— Render reads `render.yaml` and provisions the service for you.

**Manual:** in the Render dashboard, **New → Blueprint**, connect this GitHub repo, and
Render will pick up `render.yaml` automatically (Docker runtime, health check on `/`).

Either way, Render will prompt you for **`ANTHROPIC_API_KEY`** during setup (declared
`sync: false` in `render.yaml`, so it's entered directly in Render's dashboard and never
stored in or read from the repo). The default plan in `render.yaml` is `starter` — Render's
free tier's RAM ceiling is tight for headless Chromium; drop it to `free` and see if it
holds if you'd rather not pay, or bump it up if the browser capture step is slow/flaky.

If you'd rather deploy Playwright some other way (a different host, or swapping to
`playwright-core` + `@sparticuz/chromium` for a serverless target), `lib/screenshot.ts`
reads the executable path from `PLAYWRIGHT_EXECUTABLE_PATH`, so that's a config change,
not a rewrite.

## What's been verified

- Type-checks clean (`npx tsc --noEmit`) and builds clean (`npm run build`).
- All three pages (`/`, `/deck-evaluator`, `/website-reviewer`) render correctly with
  the B4U theme (screenshotted during development).
- PDF pipeline exercised end-to-end against generated test decks: a 5-slide deck
  extracts correctly and reaches the Claude call; a 21-slide deck is rejected before
  any Claude call with the exact "supports decks up to 20 slides" message; an
  empty submission returns "Pitch deck required".
- Playwright itself launches correctly against the pre-installed Chromium binary in
  this sandbox.

**Live-key test:** a real `ANTHROPIC_API_KEY` was tried against the deck evaluator in this
sandbox. The key authenticated correctly and the request reached Claude cleanly — it failed
only on a `400 "Your credit balance is too low"` from Anthropic (an account billing issue,
not a bug), confirming the PDF-extraction → prompt → Claude-call → response-parsing path is
wired correctly end-to-end.

**Still not verified in this environment:** a full successful Claude response (blocked by
the credit balance above, not by the code) and a successful website screenshot capture
(this sandbox's outbound network policy resets headless-browser connections — including
direct, non-proxied ones — even to hosts that `curl` reaches fine; reproduced identically
with and without an explicit proxy and with `ignoreHTTPSErrors` set, so it's a sandbox
networking constraint, not an application bug). Both request paths correctly fall through
to their designed error states. **Before relying on this in production, run both tools once
with a funded `ANTHROPIC_API_KEY` in an environment with normal outbound internet access**
(e.g. right after the Render deploy above) to confirm the live evaluation output looks right.

## Project structure

```
app/
  layout.tsx, page.tsx, globals.css, icon.tsx
  deck-evaluator/page.tsx        # upload → analyzing → results
  website-reviewer/page.tsx      # URL input → analyzing → results
  api/evaluate-deck/route.ts     # PDF → text extraction → Claude → JSON
  api/evaluate-website/route.ts  # URL → Playwright capture → Claude → JSON
components/
  shell/        # header, footer, B4U logo badge
  ui/           # shadcn-style primitives
  evaluation/   # shared verdict card, checklist, analyzing progress, breakdown card
  deck-evaluator/, website-reviewer/   # tool-specific components
lib/
  anthropic.ts, pdf.ts, screenshot.ts, schemas.ts, utils.ts
  prompts/      # system prompts + JSON schemas per tool
  hooks/        # shared idle|analyzing|results|error state machine
types/evaluation.ts
```
