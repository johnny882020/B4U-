import { NextRequest, NextResponse } from "next/server";
import { extractPdfText } from "@/lib/pdf";
import { generateStructuredEvaluation } from "@/lib/anthropic";
import {
  DECK_EVALUATION_SYSTEM_PROMPT,
  buildDeckEvaluationUserContent,
  deckEvaluationJsonSchema,
} from "@/lib/prompts/deck-evaluation";
import { deckEvaluationResultSchema } from "@/lib/schemas";
import { MAX_DECK_PAGES, type DeckEvaluationResult } from "@/types/evaluation";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let file: FormDataEntryValue | null = null;
  try {
    const formData = await req.formData();
    file = formData.get("file");
  } catch {
    // No parseable multipart body at all — treat the same as no file selected.
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Pitch deck required" }, { status: 400 });
  }

  try {
    const buffer = await file.arrayBuffer();
    const { pageCount, slideText } = await extractPdfText(buffer);

    if (pageCount > MAX_DECK_PAGES) {
      return NextResponse.json(
        {
          error: `This deck has ${pageCount} slides — the evaluator supports decks up to ${MAX_DECK_PAGES} slides. Trim it and try again.`,
        },
        { status: 400 },
      );
    }

    const result = await generateStructuredEvaluation<DeckEvaluationResult>({
      system: DECK_EVALUATION_SYSTEM_PROMPT,
      content: buildDeckEvaluationUserContent({ slideText, pageCount }),
      schema: deckEvaluationJsonSchema,
    });

    const validated = deckEvaluationResultSchema.parse(result);

    return NextResponse.json(validated);
  } catch (err) {
    console.error("evaluate-deck error", err);
    return NextResponse.json(
      { error: "An error occurred during evaluation. Please try again." },
      { status: 500 },
    );
  }
}
