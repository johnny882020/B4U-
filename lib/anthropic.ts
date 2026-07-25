import "server-only";
import Anthropic from "@anthropic-ai/sdk";

let _client: Anthropic | null = null;

// Don't gate on ANTHROPIC_API_KEY specifically — the zero-arg constructor
// resolves credentials itself, in order: ANTHROPIC_API_KEY ->
// ANTHROPIC_AUTH_TOKEN -> the active `ant auth login` CLI profile ->
// Workload Identity Federation env vars -> the default profile on disk.
// Gating on the env var alone would block every non-API-key credential
// source from ever being tried. If no credentials exist anywhere, the SDK
// itself raises a clear AuthenticationError on the first real request,
// which the route handlers already catch and surface cleanly.
function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic();
  }
  return _client;
}

export async function generateStructuredEvaluation<T>(opts: {
  system: string;
  content: Anthropic.MessageParam["content"];
  schema: Record<string, unknown>;
  maxTokens?: number;
}): Promise<T> {
  const client = getClient();

  const response = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: opts.maxTokens ?? 16000,
    system: opts.system,
    output_config: {
      format: { type: "json_schema", schema: opts.schema },
    },
    messages: [{ role: "user", content: opts.content }],
  });

  const textBlock = response.content.find(
    (block): block is Anthropic.TextBlock => block.type === "text",
  );

  if (!textBlock) {
    throw new Error("No text content in Claude response");
  }

  return JSON.parse(textBlock.text) as T;
}
