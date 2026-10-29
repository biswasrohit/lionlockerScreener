import type { TaskRecord } from "@/lib/session";
import type { ConditionId } from "@/lib/study";
import type { SessionRow } from "./types";

export function median(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function taskFor(row: SessionRow, condition: ConditionId): TaskRecord | undefined {
  return row.tasks.find((task) => task.condition === condition);
}

/** 1 or 2 for the position a condition was shown in, if assigned. */
export function taskPosition(row: SessionRow, condition: ConditionId): number | null {
  const index = row.tasks.findIndex((task) => task.condition === condition);
  return index === -1 ? null : index + 1;
}

export type SessionState = "ineligible" | "completed" | "partial" | "screened";

export function sessionState(row: SessionRow): SessionState {
  if (row.eligible === false) return "ineligible";
  if (row.completed) return "completed";
  return row.tasks.some((t) => t.ended_at) ? "partial" : "screened";
}

export const SESSION_STATE_LABEL: Record<SessionState, string> = {
  ineligible: "Ineligible",
  completed: "Completed",
  partial: "Partial",
  screened: "Screened only",
};

export interface ConditionSummary {
  readonly medianTimeSec: number | null;
  readonly timedCount: number;
  readonly medianConfidence: number | null;
  readonly ratedCount: number;
  readonly gaveUpCount: number;
}

export interface Summary {
  readonly started: number;
  readonly eligible: number;
  readonly completed: number;
  readonly wouldUseYes: number;
  readonly byCondition: Record<ConditionId, ConditionSummary>;
}

function summarizeCondition(rows: readonly SessionRow[], condition: ConditionId): ConditionSummary {
  const tasks = rows
    .map((row) => taskFor(row, condition))
    .filter((t): t is TaskRecord => t !== undefined && t.ended_at !== null);
  const times = tasks
    .filter((t) => !t.gave_up && t.duration_sec !== null)
    .map((t) => t.duration_sec as number);
  const ratings = tasks.filter((t) => t.confidence !== null).map((t) => t.confidence as number);
  return {
    medianTimeSec: median(times),
    timedCount: times.length,
    medianConfidence: median(ratings),
    ratedCount: ratings.length,
    gaveUpCount: tasks.filter((t) => t.gave_up).length,
  };
}

export function summarize(rows: readonly SessionRow[]): Summary {
  const completedRows = rows.filter((r) => r.completed);
  return {
    started: rows.length,
    eligible: rows.filter((r) => r.eligible === true).length,
    completed: completedRows.length,
    wouldUseYes: completedRows.filter((r) => r.would_use === "yes").length,
    byCondition: {
      status_quo: summarizeCondition(rows, "status_quo"),
      prototype: summarizeCondition(rows, "prototype"),
    },
  };
}

export function formatDuration(seconds: number | null): string {
  if (seconds === null) return "";
  const whole = Math.round(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}
