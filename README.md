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
Vercel AI SDK (`ai`) routed through **Vercel AI Gateway** to Claude
(`anthropic/claude-opus-5`, structured outputs via `generateObject` against this app's own
zod schemas) for both evaluations, `unpdf` for PDF text extraction, and `playwright-core`
(Chromium) for website screenshot + text capture — paired with `@sparticuz/chromium`'s
Lambda-optimized binary on Vercel, where a full Chromium install doesn't fit a serverless
function.

No auth, no database — every evaluation is a stateless, one-shot request; results live
only in browser state until you refresh or start another evaluation.

## Getting started

```bash
npm install
npm run dev
```

Then give the AI Gateway something to authenticate with — `lib/ai.ts` just passes the
model string `"anthropic/claude-opus-5"` to the AI SDK and lets the gateway resolve
credentials itself:

- **Recommended — link to the real Vercel project:** `npm i -g vercel` (if you don't have
  it), `vercel login`, `vercel link` (select this project), then
  `vercel env pull .env.local`. This writes a short-lived `VERCEL_OIDC_TOKEN` into
  `.env.local` for you — no key to type or paste anywhere. It's valid for ~24h; re-run
  `vercel env pull .env.local --yes` when it expires.
- **Alternative — a static gateway key:** `cp .env.example .env.local` and set
  `AI_GATEWAY_API_KEY` from the Vercel dashboard's AI Gateway settings. Useful for CI or
  if you'd rather not link the project locally.

Open http://localhost:3000. `/deck-evaluator` and `/website-reviewer` are the two tools;
`/` is the landing page.

### Environment variables

| Variable | Required | Notes |
|---|---|---|
| `VERCEL_OIDC_TOKEN` | No* | *Written automatically by `vercel env pull .env.local` (see above) — never set this by hand, and never commit it (it's short-lived, but still a real credential). Injected automatically by the platform itself on every real Vercel deployment, with zero setup. |
| `AI_GATEWAY_API_KEY` | No* | *Only needed if you're not using `vercel link` locally, or you're running somewhere that isn't Vercel and isn't this sandbox (CI, another host). The gateway checks this before falling back to `VERCEL_OIDC_TOKEN`. |
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

**No API key to add.** This app calls Claude through Vercel AI Gateway, not the Anthropic
API directly (see Stack above) — on a real Vercel deployment, the platform injects a
`VERCEL_OIDC_TOKEN` into every function invocation automatically, and the gateway
authenticates with it. The one manual step: in the Vercel dashboard, **Project → Settings
→ AI Gateway**, make sure AI Gateway is enabled for this project (it's on by default for
new projects, but confirm it if evaluations fail — see the trap below). Nothing needs to
be pasted into an environment-variable field, in this repo, or in any chat — there's no
secret to manage here at all.

Leave `PLAYWRIGHT_EXECUTABLE_PATH` unset on Vercel; it's not needed there.

> **Common first-deploy trap:** both `/deck-evaluator` and `/website-reviewer` failing
> with the exact same generic `"An error occurred during evaluation. Please try again."`
> almost always means AI Gateway isn't enabled for the project (check **Settings → AI
> Gateway**), or — much less likely, since it's zero-config by default — that Vercel isn't
> injecting `VERCEL_OIDC_TOKEN` for some reason. Both routes share the one gateway call in
> `lib/ai.ts`, so this is their one common failure point. (If only the website reviewer
> fails, with a *different* message starting `"Could not load..."`, that's a
> Playwright/capture issue instead, not credentials.) The real underlying error is always
> visible server-side in Vercel → Deployments → the deployment → Logs, since both routes
> `console.error` it before returning the generic message to the browser — look for
> `GatewayAuthenticationError` specifically.

> **Stale-deployment trap, confirmed in practice on an earlier version of this app (when
> it still called the Anthropic API directly):** if logs ever show a literal
> `Error: ANTHROPIC_API_KEY is not set`, or an error mentioning an `ms-playwright` cache
> path (e.g. `.cache/ms-playwright/chromium_headless_shell-.../chrome-headless-shell`),
> that deployment is running code from before this app migrated to AI Gateway and to
> `playwright-core` + `@sparticuz/chromium` respectively — current code contains neither
> code path. Fix: in the Vercel dashboard, **Settings → Git**, confirm "Production Branch"
> is actually set to this repo's working branch, then **Deployments**, redeploy from the
> latest commit (uncheck "Use existing Build Cache") and **promote it to Production** if
> it isn't automatically aliased. Multiple preview URLs
> (`<project>-<hash>-<team>.vercel.app`) are normal per-push previews — only the
> `Production` one (no hash) needs to be current for real usage.

**Function duration and plan:** both API routes declare `export const maxDuration = 60`
(seconds). Vercel's default function timeout is 300s on all plans as of the platform's
Fluid Compute rollout, so 60s is a deliberate, conservative ceiling here, not a
plan-imposed limit — raise it in the route files if website evaluations start timing out
(a Playwright screenshot capture plus a Claude Opus 5 vision call can occasionally run
long).

**Function size:** `playwright-core` + `@sparticuz/chromium` together are ~81MB
(confirmed locally via Next.js's own build output tracing — see "What's been verified"
below). Vercel Functions on Fluid Compute now support up to 5GB of package size, so this
was never close to a real constraint even before that increase. The `/api/evaluate-deck`
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
headless Chromium process, custom Next.js API routes, AI Gateway/Claude calls — also
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

**Live-key test (historical — predates the AI Gateway migration below):** a real
`ANTHROPIC_API_KEY` was tried against the deck evaluator in this sandbox, back when this
app called the Anthropic API directly. The key authenticated correctly and the request
reached Claude cleanly — it failed only on a `400 "Your credit balance is too low"` from
Anthropic (an account billing issue, not a bug), confirming the PDF-extraction → prompt →
Claude-call → response-parsing path was wired correctly end-to-end under that architecture.
That direct-API code path no longer exists in this repo (see "AI Gateway migration" below)
but the result is kept here since it's still evidence the PDF/prompt-building logic upstream
of the Claude call, which is unchanged, is correct.

**AI Gateway migration:** this app was moved off the direct `@anthropic-ai/sdk` integration
onto Vercel AI Gateway via the `ai` package (`lib/ai.ts`, previously `lib/anthropic.ts`) —
model calls now use `generateObject` with this app's existing zod schemas
(`lib/schemas.ts`) directly as the structured-output contract, instead of a hand-maintained
parallel JSON Schema. This removes `ANTHROPIC_API_KEY` from the picture entirely: Vercel
deployments authenticate automatically via the platform's own injected
`VERCEL_OIDC_TOKEN`, with no dashboard env var to set. Verified in this sandbox:
`npx tsc --noEmit` and `npm run build` both clean; the exact Anthropic model slug
(`anthropic/claude-opus-5`) confirmed against the AI Gateway's live, unauthenticated
`GET https://ai-gateway.vercel.sh/v1/models` endpoint rather than assumed; the multimodal
message shape for the website reviewer (`{ type: "image", image, mediaType }`) confirmed
against the `ai` package's own shipped TypeScript types rather than guessed from
documentation. Re-ran the full request-validation pass below against the migrated code —
identical results — and confirmed the real 6-slide test PDF now reaches the gateway call
and fails cleanly with the SDK's own `GatewayAuthenticationError` (no `AI_GATEWAY_API_KEY`
or `VERCEL_OIDC_TOKEN` exists in this sandbox), caught by the same try/catch as before.

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
input in its own `try/catch`, before the block that wraps the actual Claude/Playwright call.

A synthetic 6-slide PDF (generated directly as raw PDF syntax, since no PDF-authoring tool
was available in this sandbox) was POSTed to `/api/evaluate-deck` end-to-end: extraction
succeeded, slide count and text reached the prompt-building step, and the run failed only at
the gateway call itself with `GatewayAuthenticationError` (see "AI Gateway migration"
above) — i.e., everything up to needing real credentials is confirmed working.
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

**Still not verified in this environment:** a real end-to-end Claude response through AI
Gateway (this sandbox has neither a `VERCEL_OIDC_TOKEN` nor an `AI_GATEWAY_API_KEY` — see
"AI Gateway migration" above for how far the request gets without one), and a real website
screenshot capture reaching an actual public URL (blocked in this sandbox only by its own
outbound network policy on headless-browser processes — see the request-validation section
above). Neither gap is fixable from this sandbox; both require running against the real
Vercel deployment. **No form of Vercel account access (dashboard login, CLI, or MCP OAuth)
is available in this coding environment** — every deploy/promote/env-var/AI-Gateway-enable
step described above must be performed by the account owner.

**One real live deploy has been tested against, and it was running stale code:** logs
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
