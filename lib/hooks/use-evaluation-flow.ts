"use client";

import { useCallback, useRef, useState } from "react";

export type EvaluationFlowState<TResult> =
  | { status: "idle" }
  | { status: "analyzing" }
  | { status: "results"; result: TResult }
  | { status: "error"; message: string };

const MIN_ANALYZING_MS = 4000;
const MAX_ANALYZING_MS = 20000;

export function useEvaluationFlow<TInput, TResult>(
  run: (input: TInput) => Promise<TResult>,
) {
  const [state, setState] = useState<EvaluationFlowState<TResult>>({ status: "idle" });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = useCallback(
    async (input: TInput) => {
      setState({ status: "analyzing" });

      const minDelay = new Promise((resolve) => {
        timeoutRef.current = setTimeout(resolve, MIN_ANALYZING_MS);
      });

      const hardTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("timeout")), MAX_ANALYZING_MS);
      });

      try {
        const [result] = await Promise.all([
          Promise.race([run(input), hardTimeout]) as Promise<TResult>,
          minDelay,
        ]);
        setState({ status: "results", result });
      } catch (err) {
        setState({
          status: "error",
          message:
            err instanceof Error && err.message !== "timeout"
              ? err.message
              : "An error occurred during evaluation. Please try again.",
        });
      } finally {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      }
    },
    [run],
  );

  const reset = useCallback(() => {
    setState({ status: "idle" });
  }, []);

  return { state, start, reset };
}
