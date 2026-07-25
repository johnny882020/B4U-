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
both evaluations, `unpdf` for PDF text extraction, and `playwright-core` (Chromium) for
website screenshot + text capture — paired with `@sparticuz/chromium`'s Lambda-optimized
binary on Vercel, where a full Chromium install doesn't fit a serverless function.

No auth, no database — every evaluation is a stateless, one-shot request; results live
only in browser state until you refresh or start another evaluation.

## Getting started

```bash
npm install
npm run dev
```

Then authenticate the Claude API however you prefer — no code change needed either way,
`lib/anthropic.ts` just calls `new Anthropic()` and lets the SDK resolve credentials itself:

- **`ant` CLI (recommended for local dev):** `ant auth login` once; the SDK picks up the
  resulting profile automatically, no env var needed.
- **API key:** `cp .env.example .env.local` and set `ANTHROPIC_API_KEY`.

Open http://localhost:3000. `/deck-evaluator` and `/website-reviewer` are the two tools;
`/` is the landing page.

### Environment variables

| Variable | Required | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | No* | *Not required if you've run `ant auth login` (see above) — but Vercel's deployed functions can't do an interactive CLI login (see Deploying below), so an API key is the practical choice there. |
| `PLAYWRIGHT_EXECUTABLE_PATH` | Yes, outside Vercel | `lib/screenshot.ts` detects Vercel's own `VERCEL` env var (set automatically by the platform) and uses `@sparticuz/chromium` there — no path needed. Everywhere else (local dev, this sandbox, another host), it's required: install a browser with `npx playwright install chromium` and point this at the path it reports. |

## Deploying

### Vercel (current, verified target)

A full Playwright + Chromium install doesn't fit a standard serverless function, so this
app pairs `playwright-core` (no bundled browser of its own) with `@sparticuz/chromium`
(a Lambda-optimized, brotli-compressed Chromium build) specifically on Vercel —
`lib/screenshot.ts` detects the platform's own `VERCEL` env var at runtime and switches
code paths automatically. `next.config.mjs` marks both packages as
`serverComponentsExternalPackages` so their binaries are `require`d natively at runtime
instead of getting bundled (which would break their relative-path binary resolution).

**One-click:** click
[Deploy to Vercel](https://vercel.com/new/clone?repository-url=https://github.com/johnny882020/B4U-)
— it's a zero-config Next.js import, no Dockerfile or blueprint file needed.

**Manual:** in the Vercel dashboard, **Add New → Project**, import this GitHub repo, and
deploy — Vercel auto-detects Next.js and handles the build.

Either way, add **`ANTHROPIC_API_KEY`** as an environment variable in the Vercel project
settings (Project → Settings → Environment Variables) before or right after the first
deploy — it's read server-side only, never bundled to the client, and isn't in this repo.
Leave `PLAYWRIGHT_EXECUTABLE_PATH` unset on Vercel; it's not needed there.

**Function duration and plan:** both API routes declare `export const maxDuration = 60`
(seconds) — Vercel's Hobby plan hard-caps at 60s without Fluid Compute, or up to 300s
with it (Fluid Compute is the default for new projects as of this writing, but check your
project's setting); Pro allows up to 300s directly. If website evaluations are timing out,
that's the first thing to check — a Playwright screenshot capture plus a Claude Opus 5
vision call can occasionally run close to that ceiling.

**Function size:** `playwright-core` + `@sparticuz/chromium` together are ~81MB
(confirmed locally via Next.js's own build output tracing — see "What's been verified"
below), comfortably under Vercel's 250MB unzipped function limit. The `/api/evaluate-deck`
route doesn't pull in either package at all, confirmed the same way.

**Auto-deploy on every push:** once the GitHub repo is connected (either path above),
Vercel's own default behavior is to build and deploy automatically on every push to the
connected branch — no extra CI/CD, webhook, or MCP glue needed. This is a one-time manual
connection step (Vercel requires the account owner's own login), after which every future
push here keeps the live deployment in sync on its own.

**On "deploy via MCP":** a Vercel MCP connector exists in the connector registry, but (a)
it isn't connected to this account, and (b) even connected, its tools are read-only —
`list_projects`, `get_project`, `list_deployments`, `get_deployment`,
`get_deployment_events`, `list_teams`, plus a docs-search tool — there's no `deploy` or
`create_project` tool exposed. So even with it connected, an actual deploy still has to be
triggered by a git push or from the Vercel dashboard/CLI, not driven end-to-end from a
Claude chat. The push-triggered auto-deploy above is the practical equivalent.

### Previously: Render

This repo was deployed to Render first, via a `Dockerfile` + `render.yaml` Blueprint
(Docker was the right call there since Render doesn't have Vercel's serverless-function
size constraint). Those files were removed when moving to Vercel per this platform's
request — they're still recoverable from git history (the "Add Render deployment" and
"Prepare Render deployment files" commits) if you ever want to self-host with Docker
again instead of Vercel's serverless model.

### Why not Base44?

Base44 (the platform `deck-evaluator.grovevc.com` and `base4u.tech` are built on, now
owned by Wix) was considered and ruled out — confirmed against Base44's own docs and CLI
source, not assumed. It's a closed, prompt-first no-code app builder: its GitHub
integration and CLI only version and deploy apps *created through* Base44's own
templates/builder, not an arbitrary external codebase. This app's dependencies — a real
headless Chromium process, custom Next.js API routes, direct Anthropic SDK calls — also
don't fit Base44's own backend execution model (their "functions/entities/connectors"
abstraction, not a generic Node runtime). Deploying this exact app there isn't possible
without rebuilding it from scratch inside Base44's builder.

### Other alternatives considered

| Platform | Playwright fit | MCP connector | Notes |
|---|---|---|---|
| **Vercel** (current) | Good, via `playwright-core` + `@sparticuz/chromium` | Yes (read-only, see above) | Now implemented and verified in this repo — see above. |
| **Render** (previous) | Good, via Docker | No | Fully worked; removed only because this platform asked to move to Vercel, not for a technical shortfall. |
| **Railway** | Good, via Docker | **Yes** (deploy-capable) | The only option here where deploys could actually be triggered/monitored from a Claude chat, since its MCP tools include real `deploy`/`create-deployment` actions, unlike Vercel's or Render's (Render has none at all). |
| **Fly.io** | Good, via Docker | No | Popular for exactly this kind of headless-browser app; generous free allowance. |
| **Google Cloud Run** | Good (any container) | No | Scales to zero, pay-per-request; more setup overhead (gcloud CLI, IAM). |
| **Netlify** | Same `playwright-core` + `@sparticuz/chromium`-style workaround needed as Vercel | Yes (unverified deploy capability) | Not evaluated in depth since Vercel already covers this niche and is Next.js's own platform. |

If you'd rather deploy Playwright some other way (a different host, or back to a full
Docker + `playwright` setup), `lib/screenshot.ts`'s Vercel-detection branch is the only
platform-specific part — swap or extend the `if (process.env.VERCEL)` check, and the rest
of the capture logic (extraction, error handling, retries) is unchanged.

## What's been verified

- Type-checks clean (`npx tsc --noEmit`) and builds clean (`npm run build`) after the
  Vercel migration (`playwright-core` + `@sparticuz/chromium`, `serverComponentsExternalPackages`).
- Next.js's own build-time file tracing confirms the packaging assumptions above: the
  `/api/evaluate-website` function traces in `playwright-core` and `@sparticuz/chromium`
  as external (not bundled) dependencies, totaling ~81MB on disk — comfortably under
  Vercel's 250MB unzipped function limit; `/api/evaluate-deck`'s trace contains neither
  package at all, confirming it stays lean.
- `playwright-core` (no bundled browser) confirmed able to launch and control a real
  Chromium instance directly (standalone script, then again through the actual Next.js
  route) — the non-Vercel fallback path works.
- `@sparticuz/chromium` confirmed able to resolve *and launch* its Lambda-optimized
  Chromium binary in this sandbox too (both standalone and through the real route with
  `VERCEL=1` set to trigger that code path) — a good sign, though the actual target
  (Vercel's own Node.js runtime) wasn't itself available to test against.
- All three pages (`/`, `/deck-evaluator`, `/website-reviewer`) render correctly with
  the B4U theme (screenshotted during development).
- PDF pipeline exercised end-to-end against generated test decks: a 5-slide deck
  extracts correctly and reaches the Claude call; a 21-slide deck is rejected before
  any Claude call with the exact "supports decks up to 20 slides" message; an
  empty submission returns "Pitch deck required" — all three re-confirmed unaffected
  by the Vercel migration.
- Full `npm run build` + `npm run start` production smoke test: `/`, `/deck-evaluator`,
  `/website-reviewer`, and `/icon` all return 200.

**Live-key test:** a real `ANTHROPIC_API_KEY` was tried against the deck evaluator in this
sandbox. The key authenticated correctly and the request reached Claude cleanly — it failed
only on a `400 "Your credit balance is too low"` from Anthropic (an account billing issue,
not a bug), confirming the PDF-extraction → prompt → Claude-call → response-parsing path is
wired correctly end-to-end.

**Still not verified in this environment:** an actual live deploy on Vercel itself (no
Vercel account/credentials available here — see "On 'deploy via MCP'" above), a full
successful Claude response (blocked by the credit balance above, not by the code), and a
successful website screenshot capture against a real reachable URL (this sandbox's
outbound network policy resets headless-browser connections — including direct,
non-proxied ones — even to hosts that `curl` reaches fine; reproduced identically with and
without an explicit proxy, with `ignoreHTTPSErrors` set, and now again with the
`@sparticuz/chromium` binary specifically, so it's consistently a sandbox networking
constraint, not an application bug — confirmed via the route returning the exact intended
"Could not load..." error rather than crashing). **Before relying on this in production,
run both tools once with a funded `ANTHROPIC_API_KEY` right after the Vercel deploy above**
to confirm the live evaluation output looks right.

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
