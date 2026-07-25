"use client";

import { useCallback, useRef, useState } from "react";

export type EvaluationFlowState<TResult> =
  | { status: "idle" }
  | { status: "analyzing" }
  | { status: "results"; result: TResult }
  | { status: "error"; message: string };

const MIN_ANALYZING_MS = 4000;
// Server routes cap at `maxDuration = 60` (seconds). This must stay above
// that with some buffer, or a slow-but-successful evaluation gets aborted
// client-side and shown as a false error before the server would have
// returned a real result.
const MAX_ANALYZING_MS = 65000;

export function useEvaluationFlow<TInput, TResult>(
  run: (input: TInput, signal: AbortSignal) => Promise<TResult>,
) {
  const [state, setState] = useState<EvaluationFlowState<TResult>>({ status: "idle" });
  const controllerRef = useRef<AbortController | null>(null);

  const start = useCallback(
    async (input: TInput) => {
      setState({ status: "analyzing" });

      const controller = new AbortController();
      controllerRef.current = controller;
      const timeoutId = setTimeout(() => controller.abort(), MAX_ANALYZING_MS);
      const minDelay = new Promise((resolve) => setTimeout(resolve, MIN_ANALYZING_MS));

      try {
        const [result] = await Promise.all([run(input, controller.signal), minDelay]);
        setState({ status: "results", result });
      } catch (err) {
        setState({
          status: "error",
          message:
            err instanceof Error && err.name !== "AbortError"
              ? err.message
              : "This is taking longer than expected. Please try again.",
        });
      } finally {
        clearTimeout(timeoutId);
      }
    },
    [run],
  );

  const reset = useCallback(() => {
    controllerRef.current?.abort();
    setState({ status: "idle" });
  }, []);

  return { state, start, reset };
}
