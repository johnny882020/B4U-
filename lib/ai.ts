import "server-only";
import { generateObject } from "ai";
import type { UserContent } from "ai";
import type { z } from "zod";

const MODEL = "anthropic/claude-opus-5";

// Routed through Vercel AI Gateway: passing a plain "provider/model" string
// resolves credentials itself, in order: AI_GATEWAY_API_KEY -> the
// VERCEL_OIDC_TOKEN provisioned automatically on every Vercel deployment (and
// locally via `vercel env pull` after `vercel link`). No ANTHROPIC_API_KEY or
// other provider-specific key needed. If no credentials exist anywhere, the
// gateway raises a clear authentication error on the first real request,
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
