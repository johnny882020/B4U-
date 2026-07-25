import "server-only";
import { chromium, type Browser } from "playwright-core";

export interface CapturedWebsite {
  screenshotBase64: string;
  title: string | null;
  metaDescription: string | null;
  ogTitle: string | null;
  headings: string[];
  ctaTexts: string[];
  visibleText: string;
  loadWarning?: string;
}

const MAX_FULL_PAGE_HEIGHT = 8000;
const MAX_VISIBLE_TEXT_CHARS = 8000;
// Playwright's own default page.screenshot() timeout is 30s, which a
// full-page capture of a genuinely tall/heavy real-world page can exceed on
// a Lambda-optimized Chromium build -- confirmed live in production
// (`page.screenshot: Timeout 30000ms exceeded` capturing vercel.com).
const SCREENSHOT_TIMEOUT_MS = 45_000;

// playwright-core ships no browser of its own — an executable path is
// always required. Two cases:
//   - On Vercel (VERCEL is set by the platform automatically): use
//     @sparticuz/chromium's Lambda-optimized binary, the standard pairing
//     for running Playwright in a Vercel serverless function.
//   - Everywhere else (local dev, this sandbox, a different host):
//     PLAYWRIGHT_EXECUTABLE_PATH must point at a real Chromium binary —
//     e.g. one installed locally via `npx playwright install chromium`
//     (the `playwright` devDependency provides that CLI; it's never
//     imported by app code, so it's not bundled into any deployed route).
async function launchBrowser(): Promise<Browser> {
  if (process.env.VERCEL) {
    const { default: sparticuzChromium } = await import("@sparticuz/chromium");
    return chromium.launch({
      headless: true,
      args: sparticuzChromium.args,
      executablePath: await sparticuzChromium.executablePath(),
    });
  }

  const executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH;
  if (!executablePath) {
    throw new Error(
      "PLAYWRIGHT_EXECUTABLE_PATH is not set. Install a browser locally with " +
        "`npx playwright install chromium` and point this env var at it.",
    );
  }
  return chromium.launch({
    headless: true,
    executablePath,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
}

export async function captureAndExtract(url: string): Promise<CapturedWebsite> {
  const browser = await launchBrowser();

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    let loadWarning: string | undefined;
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 20_000 });
    } catch {
      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 10_000 });
        loadWarning =
          "The page did not fully finish loading before capture (network never went idle) — analysis is based on partial content.";
      } catch (err) {
        throw new Error(
          `Could not load ${url}. Confirm the URL is correct and publicly reachable.`,
        );
      }
    }

    // Check page height first (cheap, no rendering cost) so pathologically
    // tall pages never pay for an unbounded full-page capture just to have
    // it clipped away afterward — capture at the right size the first time.
    const box = await page.evaluate(() => ({
      height: document.documentElement.scrollHeight,
      width: document.documentElement.scrollWidth,
    }));
    const finalBuffer =
      box.height > MAX_FULL_PAGE_HEIGHT
        ? await page.screenshot({
            type: "png",
            timeout: SCREENSHOT_TIMEOUT_MS,
            clip: { x: 0, y: 0, width: Math.min(box.width, 1440), height: MAX_FULL_PAGE_HEIGHT },
          })
        : await page.screenshot({
            fullPage: true,
            type: "png",
            timeout: SCREENSHOT_TIMEOUT_MS,
          });

    const extracted = await page.evaluate((maxChars) => {
      const getMeta = (selector: string) =>
        document.querySelector(selector)?.getAttribute("content") ?? null;

      const headings = Array.from(document.querySelectorAll("h1, h2"))
        .slice(0, 15)
        .map((el) => el.textContent?.trim() ?? "")
        .filter(Boolean);

      const ctaTexts = Array.from(document.querySelectorAll("button, a"))
        .map((el) => el.textContent?.trim() ?? "")
        .filter((t) => t && t.length < 60)
        .slice(0, 20);

      return {
        title: document.title || null,
        metaDescription: getMeta('meta[name="description"]'),
        ogTitle: getMeta('meta[property="og:title"]'),
        headings,
        ctaTexts,
        visibleText: (document.body.innerText || "").slice(0, maxChars),
      };
    }, MAX_VISIBLE_TEXT_CHARS);

    return {
      screenshotBase64: finalBuffer.toString("base64"),
      ...extracted,
      loadWarning,
    };
  } finally {
    await browser.close();
  }
}
