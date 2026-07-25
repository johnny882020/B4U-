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

Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui-style components, the
open-source Vercel AI SDK (`ai` + `@ai-sdk/google`) calling Google Gemini directly
(`gemini-flash-latest`, structured outputs via `generateObject` against this app's own zod
schemas) for both evaluations, `unpdf` for PDF text extraction, and `playwright-core`
(Chromium) for website screenshot + text capture — paired with `@sparticuz/chromium`'s
Lambda-optimized binary on Vercel, where a full Chromium install doesn't fit a serverless
function.

No auth, no database — every evaluation is a stateless, one-shot request; results live
only in browser state until you refresh or start another evaluation.

**Why Gemini, and not Claude:** this app was originally built on Claude
(`@anthropic-ai/sdk`, then AI Gateway, then a direct `@ai-sdk/anthropic` provider — see
"What's been verified" below for that full history). Each Anthropic-based setup worked
*architecturally* but was ultimately blocked by account billing: no standing free API tier,
and the connected account's credit balance ran out in production
(`"Your credit balance is too low to access the Anthropic API"`). Gemini's Flash tier has a
genuine no-credit-card-required free quota via [Google AI
Studio](https://aistudio.google.com/apikey), and — critically for the website reviewer —
still supports multimodal (image + text) input and structured JSON output through the same
`generateObject` + zod-schema call shape, so switching providers didn't require touching
either route file, only `lib/ai.ts`.

## Getting started

```bash
npm install
npm run dev
```

Then give the Gemini provider something to authenticate with — `lib/ai.ts` just calls
`google("gemini-flash-latest")` from `@ai-sdk/google`, which resolves credentials from the
`GOOGLE_GENERATIVE_AI_API_KEY` environment variable:

- `cp .env.example .env.local` and set `GOOGLE_GENERATIVE_AI_API_KEY` (get a free one from
  [Google AI Studio](https://aistudio.google.com/apikey) — no credit card required).

Open http://localhost:3000. `/deck-evaluator` and `/website-reviewer` are the two tools;
`/` is the landing page.

### Environment variables

| Variable | Required | Notes |
|---|---|---|
| `GOOGLE_GENERATIVE_AI_API_KEY` | Yes | Get a free key from [Google AI Studio](https://aistudio.google.com/apikey) — no credit card required. Set it in `.env.local` for local dev, and directly in the Vercel dashboard (Project → Settings → Environment Variables, Production environment) for deploys — never paste a real key into a chat, a commit, or any file that gets committed. |
| `PLAYWRIGHT_EXECUTABLE_PATH` | Yes, outside Vercel | `lib/screenshot.ts` detects Vercel's own `VERCEL` env var (set automatically by the platform) and uses `@sparticuz/chromium` there — no path needed. Everywhere else (local dev, this sandbox, another host), it's required: install a browser with `npx playwright install chromium` and point this at the path it reports. |

## Deploying

### Vercel (current, verified target)

A full Playwright + Chromium install doesn't fit a standard serverless function, so this
app pairs `playwright-core` (no bundled browser of its own) with `@sparticuz/chromium`
(a Lambda-optimized, brotli-compressed Chromium build) specifically on Vercel —
`lib/screenshot.ts` detects the platform's own `VERCEL` env var at runtime and switches
code paths automatically. `next.config.mjs` marks both packages as
`serverComponentsExternalPackages` so their binaries are `require`d natively at runtime
instead of getting bundled (which would break their relative-path binary resolution) —
**and** sets `experimental.outputFileTracingIncludes` to force-include
`@sparticuz/chromium`'s `bin/` directory (its brotli-compressed binaries) into the
`/api/evaluate-website` function specifically. That second part isn't optional: marking
the package external only stops *webpack* from bundling it — Vercel's separate build-time
file tracer decides what actually ships in the function, and its static analysis doesn't
detect `bin/`'s files as needed (they're read via a runtime-computed path, not a static
`require()`), so without this the function throws `The input directory
".../@sparticuz/chromium/bin" does not exist` at runtime — confirmed live in production
before this fix (see "What's been verified" below).

**One-click:** click
[Deploy to Vercel](https://vercel.com/new/clone?repository-url=https://github.com/johnny882020/B4U-)
— it's a zero-config Next.js import, no Dockerfile or blueprint file needed.

**Manual:** in the Vercel dashboard, **Add New → Project**, import this GitHub repo, and
deploy — Vercel auto-detects Next.js and handles the build.

Add **`GOOGLE_GENERATIVE_AI_API_KEY`** as an environment variable **directly in the Vercel
dashboard** — Project → Settings → Environment Variables — for the **Production**
environment. It's read server-side only, never bundled to the client, and isn't in this
repo.

> **This key must never be pasted into a chat with an AI assistant, a commit, or any file
> in this repo — including by Claude itself.** A chat transcript is not a secure secret
> store. The dashboard field above is the only place it should go. If a real key was ever
> pasted somewhere other than the Vercel dashboard, treat it as compromised and rotate it
> from [Google AI Studio](https://aistudio.google.com/apikey).

Leave `PLAYWRIGHT_EXECUTABLE_PATH` unset on Vercel; it's not needed there.

> **Common first-deploy trap:** both `/deck-evaluator` and `/website-reviewer` failing
> with the exact same generic `"An error occurred during evaluation. Please try again."`
> almost always means `GOOGLE_GENERATIVE_AI_API_KEY` is missing — both routes share the
> one Gemini call in `lib/ai.ts`, so this is their one common failure point. (If only
> the website reviewer fails, with a *different* message starting `"Could not load..."`,
> that's a Playwright/capture issue instead, not credentials.) **Also:** adding the env var
> alone doesn't fix an already-running deployment — Vercel doesn't retroactively apply it,
> so trigger a new deploy (dashboard "Redeploy", or push a commit) after setting it. The
> real underlying error is always visible server-side in Vercel → Deployments → the
> deployment → Logs, since both routes `console.error` it before returning the generic
> message to the browser.

> **`@sparticuz/chromium` bin-not-found trap, hit in practice on this app:** if the website
> reviewer specifically fails with `Error: The input directory
> ".../@sparticuz/chromium/bin" does not exist`, that's the file-tracing gap described
> above — `next.config.mjs`'s `outputFileTracingIncludes` fixes it (present in current
> code, confirmed via `.next/server/app/api/evaluate-website/route.js.nft.json` actually
> listing the 4 `bin/*.br` files after the fix — see "What's been verified"). Seeing this
> error means the deployment predates that fix; redeploy from the latest commit.

> **Stale-deployment trap:** if logs mention `ANTHROPIC_API_KEY`, `GatewayInternalServerError`
> / `customer_verification_required`, or an `ms-playwright` cache path (e.g.
> `.cache/ms-playwright/chromium_headless_shell-.../chrome-headless-shell`), that deployment
> predates the Gemini migration (or the AI Gateway/Playwright migrations before it) — current
> code contains none of those code paths. Fix: in the Vercel dashboard, **Settings → Git**,
> confirm "Production Branch" is actually set to this repo's working branch, then
> **Deployments**, redeploy from the latest commit (uncheck "Use existing Build Cache") and
> **promote it to Production** if it isn't automatically aliased. Multiple preview URLs
> (`<project>-<hash>-<team>.vercel.app`) are normal per-push previews — only the
> `Production` one (no hash) needs to be current for real usage. If in doubt, an empty
> commit (`git commit --allow-empty`) forces a guaranteed-fresh build.

**Function duration and plan:** `/api/evaluate-deck` declares `maxDuration = 60` (seconds);
`/api/evaluate-website` declares `maxDuration = 120`. Vercel's default function timeout is
300s on all plans as of the platform's Fluid Compute rollout, so neither is a plan-imposed
limit — both are deliberate, conservative ceilings below that default, raised only as far as
observed need requires. The website route's higher ceiling isn't precautionary: it was hit
in practice — a cold-start `@sparticuz/chromium` launch (brotli-decompressing a ~65MB
binary on the function's first invocation) plus a full-page screenshot of a heavy site plus
a Gemini vision call took long enough to trip the original 60s limit
(`FUNCTION_INVOCATION_TIMEOUT`, confirmed live in production against `vercel.com`). Raise it
further in the route file (and the matching client-side `MAX_ANALYZING_MS` in
`lib/hooks/use-evaluation-flow.ts`, which must stay above whichever server route's ceiling
is higher) if it's still not enough.

**Function size:** the `/api/evaluate-website` function traces to ~74MB total, including
`@sparticuz/chromium`'s brotli-compressed binaries under `bin/` (the ones force-included by
`outputFileTracingIncludes` above — measured directly off the actual files listed in
`.next/server/app/api/evaluate-website/route.js.nft.json` after that fix, not estimated).
Vercel Functions on Fluid Compute support up to 5GB of package size, so this is nowhere
close to a real constraint. The `/api/evaluate-deck` route doesn't pull in `playwright-core`
or `@sparticuz/chromium` at all, confirmed the same way.

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
headless Chromium process, custom Next.js API routes, direct Anthropic/Claude calls — also
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
  as external (not bundled) dependencies — see the corrected, complete ~74MB figure
  (including `@sparticuz/chromium`'s `bin/` binaries) in "Function size" above and in the
  bin-not-found bug entry below; `/api/evaluate-deck`'s trace contains neither package at
  all, confirming it stays lean. Both comfortably under Vercel's 5GB Fluid Compute package
  size limit either way.
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

**Live-key test (historical — predates the AI Gateway migration below):** a real
`ANTHROPIC_API_KEY` was tried against the deck evaluator in this sandbox, back when this
app called the Anthropic API directly. The key authenticated correctly and the request
reached Claude cleanly — it failed only on a `400 "Your credit balance is too low"` from
Anthropic (an account billing issue, not a bug), confirming the PDF-extraction → prompt →
Claude-call → response-parsing path was wired correctly end-to-end under that architecture.
That direct-API code path no longer exists in this repo (see "AI Gateway migration" below)
but the result is kept here since it's still evidence the PDF/prompt-building logic upstream
of the Claude call, which is unchanged, is correct.

**AI Gateway migration (superseded — see next entry):** this app was briefly moved off the
direct `@anthropic-ai/sdk` integration onto Vercel AI Gateway via the `ai` package
(`lib/ai.ts`, previously `lib/anthropic.ts`) — model calls switched to `generateObject`
with this app's existing zod schemas (`lib/schemas.ts`) directly as the structured-output
contract, instead of a hand-maintained parallel JSON Schema (that part of the change is
kept). Verified in this sandbox at the time: `npx tsc --noEmit` and `npm run build` both
clean; the exact Anthropic model slug confirmed against the AI Gateway's live,
unauthenticated `GET https://ai-gateway.vercel.sh/v1/models` endpoint rather than assumed;
the multimodal message shape for the website reviewer confirmed against the `ai` package's
own shipped TypeScript types rather than guessed from documentation.

**Direct-provider reversion:** on a real deploy, AI Gateway turned out to require a credit
card on file in the Vercel account before serving *any* request — including its advertised
free monthly credits — which surfaced as `GatewayInternalServerError` /
`customer_verification_required` in production logs (see the "AI Gateway billing trap"
callout above). Moved `lib/ai.ts` to call `@ai-sdk/anthropic`'s `anthropic()` provider
directly instead of a gateway model string — same `generateObject` + zod-schema call shape,
so the two route files didn't need to change at all. This required bumping `ai` from the
`^6.0.235` the AI Gateway skill's guidance had installed up to the actual current npm
`latest` (`^7.0.37`): `@ai-sdk/anthropic`'s current release depends on a newer
`@ai-sdk/provider` major (confirmed by inspecting both packages' `package.json`
`dependencies` directly, not assumed) than `ai@6` ships, which surfaced immediately as a
`tsc` type error (`LanguageModelV4` not assignable where `ai@6` expected
`LanguageModelV2 | LanguageModelV3`) — resolved by the version bump, not by working around
the mismatch. Re-verified after the bump: `npx tsc --noEmit` and `npm run build` both
clean; re-ran the full request-validation pass below unchanged; the real 6-slide test PDF
now reaches the direct-provider call and fails cleanly with `AI_LoadAPIKeyError` (this
sandbox has no `ANTHROPIC_API_KEY`), caught by the same try/catch as before. AI Gateway is
no longer called anywhere in this codebase.

**Gemini migration (current):** even the direct Anthropic provider above was blocked in
production — not by code, but by the connected Anthropic account's credit balance running
out (`AI_APICallError`, `"Your credit balance is too low to access the Anthropic API"`,
confirmed live against `https://api.anthropic.com/v1/messages` with a correctly-resolved
key and model, i.e. everything upstream of Anthropic's own billing check was proven
correct). Anthropic has no standing free API tier, so `lib/ai.ts` was moved to
`@ai-sdk/google`'s `google()` provider (`gemini-flash-latest`), which has a genuine
no-credit-card-required free quota via Google AI Studio and still supports the multimodal
image+text input the website reviewer needs, plus structured JSON output — same
`generateObject` + zod-schema call shape as the Anthropic version, so the route files
didn't change. `@ai-sdk/anthropic` was uninstalled; `@ai-sdk/google` depends on the same
`@ai-sdk/provider@4.0.3` already pulled in by `ai@7`, confirmed via `npm view ... dependencies`
before installing rather than assumed, so no further version bump was needed. Verified in
this sandbox: `npx tsc --noEmit` and `npm run build` both clean; full request-validation
pass re-run with identical results; the real test PDF now reaches the Gemini call and fails
cleanly with `AI_LoadAPIKeyError` from `@ai-sdk/google` (this sandbox has no
`GOOGLE_GENERATIVE_AI_API_KEY`), caught by the same error handling as every provider before
it. Not verified here: an actual successful Gemini response (needs a real, funded-or-free
key against a live Vercel deployment) and Gemini's actual output quality/comparability to
Claude for this specific structured-evaluation task — worth a side-by-side read of a real
result once a key is live.

**Full request-validation pass (latest round):** every input-handling branch on both routes
was exercised directly against a running dev server, not just read for correctness:

| Request | Before this round | Now |
|---|---|---|
| No file on `/api/evaluate-deck` | `400 "Pitch deck required"` | unchanged |
| Non-PDF file on `/api/evaluate-deck` | `500` generic message (bug — this is a client input error) | `400 "That file doesn't look like a valid PDF..."` |
| Real multi-slide PDF | reaches the Claude call correctly | unchanged, re-confirmed |
| Missing/invalid `url` on `/api/evaluate-website` (absent field, non-URL string, unparseable JSON body) | `500` generic message (bug) | `400 "Enter a valid website URL (including https://) and try again."` |
| Valid `url`, unreachable page | `500 "Could not load..."` | unchanged |

The two `500`-for-bad-input cases were genuine bugs (client validation errors were falling
through into the generic server-error catch block instead of returning `400`) — fixed in
both `app/api/evaluate-deck/route.ts` and `app/api/evaluate-website/route.ts` by validating
input in its own `try/catch`, before the block that wraps the actual Gemini/Playwright call.

A synthetic 6-slide PDF (generated directly as raw PDF syntax, since no PDF-authoring tool
was available in this sandbox) was POSTed to `/api/evaluate-deck` end-to-end: extraction
succeeded, slide count and text reached the prompt-building step, and the run failed only at
the Gemini call itself with `AI_LoadAPIKeyError` (see "Gemini migration" above) — i.e.,
everything up to needing real credentials is confirmed working.
`/api/evaluate-website` was POSTed a real reachable URL (`https://example.com`) using the
sandbox's pre-installed, version-matched Chromium (`playwright-core` 1.62.0): the browser
launched and attempted navigation correctly, but the connection itself was reset — isolated
with a standalone script to be this sandbox's outbound network policy blocking the headless
browser process specifically (`curl` and Node's own `fetch` reach the same URL from the same
sandbox without issue; the browser fails identically with no proxy, with an explicit
`--proxy-server` pointed at the sandbox's own proxy, and with `--ignore-certificate-errors`
added, ruling out a certificate-trust issue). This is a restriction of this coding sandbox,
not of the app or of Vercel's network, and matches the same finding from the original Vercel
migration testing.

**Live production verification:** this sandbox has no Vercel account access (dashboard
login, CLI, or MCP OAuth) and never has — every deploy/promote/env-var step in this doc
must be performed by the account owner. But the deployed app's public API routes are just
normal internet endpoints, so once a deployment is live, `curl`-ing
`https://b4-u-pi.vercel.app/api/evaluate-deck` and `/api/evaluate-website` directly from
this sandbox *is* a real, direct production test — no account access needed for that part.
Several rounds of this, so far — culminating in a genuine end-to-end success for both
tools:

- **Deck evaluator: passed.** A real POST with a real multi-slide PDF returned `200` with a
  coherent, accurate, well-structured evaluation (correct slide count, content grounded in
  the actual deck text, sensible confidence levels) — the first fully successful live
  result across every architecture this app has gone through.
- **Website reviewer, round 1: `500`, root-caused, fixed.** The Vercel logs (shared by the
  account owner, since this sandbox can't read them directly) showed `Error: The input
  directory ".../@sparticuz/chromium/bin" does not exist` — the file-tracing gap described
  above, not a credentials or capture-logic problem. Fixed via `outputFileTracingIncludes`,
  confirmed empirically (not just assumed fixed) by rebuilding and inspecting
  `.next/server/app/api/evaluate-website/route.js.nft.json` directly: 0 of
  `@sparticuz/chromium`'s `bin/*.br` files were listed before the fix, all 4 are listed
  after, and `/api/evaluate-deck`'s trace file confirmed to still have zero
  Playwright/Chromium files leaking in (the fix is scoped to the one route that needs it).
- **Website reviewer, round 2: `504 FUNCTION_INVOCATION_TIMEOUT`, different failure,
  progress.** Re-tested live after shipping the fix above: no longer the same crash — the
  function now actually launches Chromium and runs, it just didn't finish inside the
  original 60s `maxDuration` against a heavy real site (`vercel.com`) on what was likely a
  cold start. Raised to 120s (see "Function duration and plan" above) and the matching
  client-side timeout in `lib/hooks/use-evaluation-flow.ts`.
- **Website reviewer, round 3: `page.screenshot: Timeout 30000ms exceeded`, root-caused,
  fixed.** Re-tested live again: past both the crash and the 120s ceiling this time (the
  function completed within budget), but `page.screenshot()` itself hit Playwright's own
  default 30s timeout capturing `vercel.com` full-page — a genuinely tall/heavy page on a
  Lambda-optimized Chromium build. Fixed two ways in `lib/screenshot.ts`: an explicit,
  longer `timeout: 45_000` on the screenshot call itself, and a structural fix — page height
  is now checked *before* screenshotting (cheap, no rendering cost) so a pathologically tall
  page goes straight to a clipped, bounded capture instead of always attempting an unbounded
  full-page screenshot first and only clipping it away afterward.
- **Website reviewer, round 4: passed against a typical site; `vercel.com` specifically
  still times out, and that's being accepted as a known limit rather than chased further.**
  Re-tested live against `https://example.com` (deliberately lighter than `vercel.com`, to
  separate "is the pipeline broken" from "is this one page unusually heavy"): `200` in
  15.8s, with a coherent, accurate, well-structured review — **first fully successful live
  result for both tools**, on realistic input. `https://vercel.com` — an unusually
  heavy, animation- and JS-rich marketing page — still hit `504
  FUNCTION_INVOCATION_TIMEOUT` even with the round-2 and round-3 fixes in place, meaning the
  full pipeline (cold-start Chromium + navigation + screenshot + Gemini vision call) for
  that specific page exceeds the 120s ceiling. Deliberately not raising the timeout further
  to chase it: this app reviews a solo founder's *own* site, not arbitrary large marketing
  sites, and a synchronous browser wait past ~2 minutes is already a poor experience
  regardless of whether the backend eventually succeeds. Surfaced one genuinely general bug
  while investigating this, fixed in both `app/deck-evaluator/page.tsx` and
  `app/website-reviewer/page.tsx`: a platform-level timeout like this returns a plain-text
  error page, not JSON, and the client was calling `res.json()` unconditionally — a raw
  parse error instead of the clean message it was supposed to show. Now parses the response
  body defensively (`res.text()` then a guarded `JSON.parse`) so *any* non-JSON failure
  response — this one included — falls back to the same clean generic error message instead
  of a confusing raw exception.

**One earlier live deploy was also tested against and found running stale code:** logs
pulled from `b4-u-pi.vercel.app` showed both the pre-fix `ANTHROPIC_API_KEY is not set`
string and the pre-migration `ms-playwright` cache-path error described in the
"Stale-deployment trap" callout above — meaning that deployment predated both fixes in this
repo's history, independent of whether the env var was ever set. **Before concluding either
tool is broken on a live deployment, first rule out a stale build** using the steps in that
callout, then retest with a funded key.

## Project structure

```
app/
  layout.tsx, page.tsx, globals.css, icon.tsx
  deck-evaluator/page.tsx, layout.tsx, loading.tsx        # upload → analyzing → results
  website-reviewer/page.tsx, layout.tsx, loading.tsx      # URL input → analyzing → results
  api/evaluate-deck/route.ts     # PDF → text extraction → Gemini → JSON
  api/evaluate-website/route.ts  # URL → Playwright capture → Gemini → JSON
components/
  shell/        # header, footer, B4U logo badge
  ui/           # shadcn-style primitives
  evaluation/   # shared verdict card, checklist, analyzing progress, breakdown card
  deck-evaluator/, website-reviewer/   # tool-specific components
lib/
  ai.ts, pdf.ts, screenshot.ts, schemas.ts, utils.ts
  prompts/      # system prompts + user-content builders per tool (structured output is
                 # driven by the zod schemas in schemas.ts, passed straight to generateObject)
  hooks/        # shared idle|analyzing|results|error state machine
types/evaluation.ts
```
