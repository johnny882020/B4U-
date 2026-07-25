import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { captureAndExtract } from "@/lib/screenshot";
import { generateStructuredEvaluation } from "@/lib/anthropic";
import {
  WEBSITE_EVALUATION_SYSTEM_PROMPT,
  buildWebsiteEvaluationTextContent,
  websiteEvaluationJsonSchema,
} from "@/lib/prompts/website-evaluation";
import { websiteEvaluationResultSchema } from "@/lib/schemas";
import type { WebsiteEvaluationResult } from "@/types/evaluation";

export const maxDuration = 60;

const requestSchema = z.object({ url: z.string().url() });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = requestSchema.parse(body);

    const capture = await captureAndExtract(url);

    const content: Array<
      | { type: "image"; source: { type: "base64"; media_type: "image/png"; data: string } }
      | { type: "text"; text: string }
    > = [
      {
        type: "image",
        source: { type: "base64", media_type: "image/png", data: capture.screenshotBase64 },
      },
      {
        type: "text",
        text: buildWebsiteEvaluationTextContent({ url, ...capture }),
      },
    ];

    const result = await generateStructuredEvaluation<WebsiteEvaluationResult>({
      system: WEBSITE_EVALUATION_SYSTEM_PROMPT,
      content,
      schema: websiteEvaluationJsonSchema,
    });

    const validated = websiteEvaluationResultSchema.parse(result);

    return NextResponse.json(validated);
  } catch (err) {
    console.error("evaluate-website error", err);
    const message =
      err instanceof Error && err.message.startsWith("Could not load")
        ? err.message
        : "An error occurred during evaluation. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
