import "server-only";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import type { UserContent } from "ai";
import type { z } from "zod";

const MODEL = google("gemini-flash-latest");

// Direct Google provider from the (open-source, MIT-licensed) Vercel AI SDK.
// Gemini's Flash tier has a genuine no-credit-card-required free quota
// (unlike the Anthropic API, which has no standing free tier and rejects
// requests once trial credits run out), and supports both the multimodal
// image+text input the website reviewer needs and structured JSON output.
// The `google` provider resolves credentials from the
// GOOGLE_GENERATIVE_AI_API_KEY environment variable. If it's missing, the
// provider raises a clear authentication error on the first real request,
// which the route handlers already catch and surface cleanly.
export async function generateStructuredEvaluation<T>(opts: {
  system: string;
  content: UserContent;
  schema: z.ZodType<T>;
  maxTokens?: number;
}): Promise<T> {
  const { object } = await generateObject({
    model: MODEL,
    system: opts.system,
    schema: opts.schema,
    messages: [{ role: "user", content: opts.content }],
    maxOutputTokens: opts.maxTokens ?? 16000,
  });

  return object;
}
