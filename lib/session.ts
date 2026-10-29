// Shape of a participant session as sent from the browser to /api/session.
// The server validates every save with this schema before touching the DB.

import { z } from "zod";
import { BUILDING_IDS, DURATION_IDS } from "./storage";
import {
  CONDITION_IDS,
  DAYS_VALUES,
  IS_GRAD_VALUES,
  LAPTOP_VALUES,
  MAX_ANSWER_LENGTH,
  MAX_BLOCKER_LENGTH,
  SCENARIO_IDS,
  SOURCE_VALUES,
  TASK_ORDERS,
  WOULD_USE_VALUES,
  isEligible,
} from "./study";

const MAX_TASK_SECONDS = 24 * 60 * 60;
const MAX_SEARCHES = 200;

export const searchSchema = z.object({
  building: z.enum(BUILDING_IDS),
  duration: z.enum(DURATION_IDS),
  at_sec: z.number().min(0).max(MAX_TASK_SECONDS),
});

export const taskSchema = z.object({
  condition: z.enum(CONDITION_IDS),
  scenario: z.enum(SCENARIO_IDS),
  started_at: z.iso.datetime().nullable(),
  ended_at: z.iso.datetime().nullable(),
  duration_sec: z.number().min(0).max(MAX_TASK_SECONDS).nullable(),
  answer: z.string().max(MAX_ANSWER_LENGTH).nullable(),
  gave_up: z.boolean(),
  confidence: z.number().int().min(1).max(5).nullable(),
  searches: z.array(searchSchema).max(MAX_SEARCHES),
});

export const screenerSchema = z.object({
  is_grad: z.enum(IS_GRAD_VALUES),
  days_on_campus: z.enum(DAYS_VALUES),
  carries_laptop: z.enum(LAPTOP_VALUES),
  source: z.enum(SOURCE_VALUES),
});

export const sessionPayloadSchema = z
  .object({
    id: z.uuid(),
    screener: screenerSchema,
    task_order: z.enum(TASK_ORDERS).nullable(),
    tasks: z.array(taskSchema).max(2),
    would_use: z.enum(WOULD_USE_VALUES).nullable(),
    blocker: z.string().max(MAX_BLOCKER_LENGTH).nullable(),
    completed: z.boolean(),
    finished_at: z.iso.datetime().nullable(),
  })
  .strict();

export type Search = z.infer<typeof searchSchema>;
export type TaskRecord = z.infer<typeof taskSchema>;
export type SessionPayload = z.infer<typeof sessionPayloadSchema>;

/** Columns written by participant saves. Team score columns are never included. */
export interface SessionWrite {
  readonly id: string;
  readonly is_grad: string;
  readonly days_on_campus: string;
  readonly carries_laptop: string;
  readonly source: string;
  readonly eligible: boolean;
  readonly task_order: string | null;
  readonly tasks: readonly TaskRecord[];
  readonly would_use: string | null;
  readonly blocker: string | null;
  readonly completed: boolean;
  readonly finished_at: string | null;
}

/**
 * Turns a validated payload into a DB row. Eligibility is recomputed here so
 * the browser can't mislabel itself, and searches are dropped from status quo
 * tasks since only the prototype logs them.
 */
export function toSessionWrite(payload: SessionPayload): SessionWrite {
  const blocker = payload.blocker?.trim() ? payload.blocker.trim() : null;
  return {
    id: payload.id,
    is_grad: payload.screener.is_grad,
    days_on_campus: payload.screener.days_on_campus,
    carries_laptop: payload.screener.carries_laptop,
    source: payload.screener.source,
    eligible: isEligible(payload.screener),
    task_order: payload.task_order,
    tasks: payload.tasks.map((task) =>
      task.condition === "prototype" ? task : { ...task, searches: [] },
    ),
    would_use: payload.would_use,
    blocker,
    completed: payload.completed,
    finished_at: payload.completed ? payload.finished_at : null,
  };
}
