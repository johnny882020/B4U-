import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { UserContent } from "ai";
import { captureAndExtract } from "@/lib/screenshot";
import { generateStructuredEvaluation } from "@/lib/ai";
import {
  WEBSITE_EVALUATION_SYSTEM_PROMPT,
  buildWebsiteEvaluationTextContent,
} from "@/lib/prompts/website-evaluation";
import { websiteEvaluationResultSchema } from "@/lib/schemas";

// Higher than /api/evaluate-deck's: a cold-start @sparticuz/chromium launch
// (brotli-decompressing a ~65MB binary on first invocation) plus a full-page
// screenshot of a heavy site plus a Gemini vision call can genuinely exceed
// 60s -- confirmed live in production (FUNCTION_INVOCATION_TIMEOUT at 60s on
// a cold start against vercel.com). Vercel's default function timeout is
// 300s on all plans, so this has real headroom to work with.
export const maxDuration = 120;

const requestSchema = z.object({ url: z.string().url() });

export async function POST(req: NextRequest) {
  let url: string;
  try {
    const body = await req.json();
    ({ url } = requestSchema.parse(body));
  } catch {
    return NextResponse.json(
      { error: "Enter a valid website URL (including https://) and try again." },
      { status: 400 },
    );
  }

  try {
    const capture = await captureAndExtract(url);

    const content: UserContent = [
      {
        type: "image",
        image: capture.screenshotBase64,
        mediaType: "image/png",
      },
      {
        type: "text",
        text: buildWebsiteEvaluationTextContent({ url, ...capture }),
      },
    ];

    const result = await generateStructuredEvaluation({
      system: WEBSITE_EVALUATION_SYSTEM_PROMPT,
      content,
      schema: websiteEvaluationResultSchema,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("evaluate-website error", err);
    const message =
      err instanceof Error && err.message.startsWith("Could not load")
        ? err.message
        : "An error occurred during evaluation. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
