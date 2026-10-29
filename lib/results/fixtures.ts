import type { TaskRecord } from "@/lib/session";
import type { SessionRow } from "./types";

export function task(overrides: Partial<TaskRecord>): TaskRecord {
  return {
    condition: "status_quo",
    scenario: "dodge",
    started_at: "2026-10-29T15:00:00.000Z",
    ended_at: "2026-10-29T15:01:00.000Z",
    duration_sec: 60,
    answer: "answer",
    gave_up: false,
    confidence: 3,
    searches: [],
    ...overrides,
  };
}

export function row(overrides: Partial<SessionRow>): SessionRow {
  return {
    id: "00000000-0000-4000-8000-000000000000",
    created_at: "2026-10-29T15:00:00.000Z",
    updated_at: "2026-10-29T15:05:00.000Z",
    is_grad: "yes",
    days_on_campus: "3-4",
    carries_laptop: "yes",
    source: "friend",
    eligible: true,
    task_order: "status_quo_first",
    tasks: [],
    would_use: null,
    blocker: null,
    completed: false,
    finished_at: null,
    score_status_quo: null,
    score_prototype: null,
    ...overrides,
  };
}
