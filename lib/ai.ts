import "server-only";
import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import type { UserContent } from "ai";
import type { z } from "zod";

const MODEL = anthropic("claude-opus-5");

// Direct Anthropic provider from the (open-source, MIT-licensed) Vercel AI
// SDK — not routed through Vercel AI Gateway. The `anthropic` provider
// resolves credentials itself, in order: ANTHROPIC_API_KEY ->
// ANTHROPIC_AUTH_TOKEN. This bills against your own Anthropic account
// directly, with no Vercel-side credit-card requirement. If no credentials
// exist, the provider raises a clear authentication error on the first real
// request, which the route handlers already catch and surface cleanly.
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
