"use client";

import { useState, useTransition } from "react";
import { updateScore } from "@/app/results/actions";
import { SCORE_VALUES, type Score } from "@/lib/results/types";
import type { ConditionId } from "@/lib/study";
import styles from "./results.module.css";

const LABELS: Record<Score, string> = { correct: "Correct", partly: "Partly", wrong: "Wrong" };

interface ScoreToggleProps {
  readonly sessionId: string;
  readonly condition: ConditionId;
  readonly participant: string;
  readonly initial: Score | null;
}

/** Correct / partly / wrong. Tap the active choice again to clear it. */
export function ScoreToggle({ sessionId, condition, participant, initial }: ScoreToggleProps) {
  const [score, setScoreState] = useState<Score | null>(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function choose(value: Score) {
    const previous = score;
    const next = previous === value ? null : value;
    setScoreState(next);
    setError(null);
    startTransition(async () => {
      const result = await updateScore({ sessionId, condition, score: next });
      if (!result.ok) {
        setScoreState(previous);
        setError(result.error);
      }
    });
  }

  const conditionLabel = condition === "status_quo" ? "status quo" : "prototype";

  return (
    <div className={styles.score}>
      <div
        className={styles.scoreGroup}
        role="group"
        aria-label={`Score ${participant} ${conditionLabel} answer`}
        aria-busy={pending}
      >
        {SCORE_VALUES.map((value) => (
          <button
            key={value}
            type="button"
            className={styles.scoreBtn}
            data-value={value}
            aria-pressed={score === value}
            onClick={() => choose(value)}
          >
            {LABELS[value]}
          </button>
        ))}
      </div>
      {error ? (
        <span className={styles.scoreError} role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
