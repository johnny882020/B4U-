import "server-only";
import Anthropic from "@anthropic-ai/sdk";

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not set");
    }
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
