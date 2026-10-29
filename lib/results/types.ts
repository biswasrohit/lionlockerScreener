import type { TaskRecord } from "@/lib/session";
import type { ConditionId } from "@/lib/study";

export const SCORE_VALUES = ["correct", "partly", "wrong"] as const;
export type Score = (typeof SCORE_VALUES)[number];

/** A row of public.sessions as read by the results page. */
export interface SessionRow {
  readonly id: string;
  readonly created_at: string;
  readonly updated_at: string;
  readonly is_grad: string | null;
  readonly days_on_campus: string | null;
  readonly carries_laptop: string | null;
  readonly source: string | null;
  readonly eligible: boolean | null;
  readonly task_order: string | null;
  readonly tasks: readonly TaskRecord[];
  readonly would_use: string | null;
  readonly blocker: string | null;
  readonly completed: boolean;
  readonly finished_at: string | null;
  readonly score_status_quo: Score | null;
  readonly score_prototype: Score | null;
}

export function scoreColumn(condition: ConditionId): "score_status_quo" | "score_prototype" {
  return condition === "status_quo" ? "score_status_quo" : "score_prototype";
}
