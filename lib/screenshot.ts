import "server-only";
import { chromium } from "playwright";

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

// Only override the executable path when explicitly configured (e.g. a
// dev sandbox with a pre-installed browser at a nonstandard location). In
// the production Docker image (see Dockerfile) Playwright's own bundled
// browser resolution finds Chromium at its default install location, so
// leaving this unset there is correct — hardcoding a sandbox-specific path
// as the default would break that.
async function launchBrowser() {
  const executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined;
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

    const screenshotBuffer = await page.screenshot({
      fullPage: true,
      type: "png",
      clip: undefined,
    });

    // Guard against pathologically tall pages inflating the image beyond
    // useful token cost — re-capture clipped to a max height if needed.
    let finalBuffer = screenshotBuffer;
    const box = await page.evaluate(() => ({
      height: document.documentElement.scrollHeight,
      width: document.documentElement.scrollWidth,
    }));
    if (box.height > MAX_FULL_PAGE_HEIGHT) {
      finalBuffer = await page.screenshot({
        type: "png",
        clip: { x: 0, y: 0, width: Math.min(box.width, 1440), height: MAX_FULL_PAGE_HEIGHT },
      });
    }

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
