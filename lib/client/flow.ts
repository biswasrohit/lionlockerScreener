// Participant flow as a pure state machine. Every transition returns a new
// state object. The UI calls `advance`, then saves the result when
// `shouldSave` says so.

import type { Search, SessionPayload, TaskRecord } from "@/lib/session";
import {
  isEligible,
  type Assignment,
  type ScreenerAnswers,
  type TaskOrder,
  type WouldUse,
} from "@/lib/study";

export type TaskIndex = 0 | 1;

export type Step =
  | { readonly name: "welcome" }
  | { readonly name: "screener" }
  | { readonly name: "ineligible" }
  | { readonly name: "task_intro"; readonly index: TaskIndex }
  | { readonly name: "task"; readonly index: TaskIndex }
  | { readonly name: "confidence"; readonly index: TaskIndex }
  | { readonly name: "final" }
  | { readonly name: "debrief" };

export interface FlowState {
  readonly version: 1;
  readonly id: string;
  readonly step: Step;
  readonly screener: ScreenerAnswers | null;
  readonly order: TaskOrder | null;
  readonly tasks: readonly TaskRecord[];
  /** Unsent text in the current task's answer box, kept so a reload doesn't lose it. */
  readonly draft: string;
  readonly wouldUse: WouldUse | null;
  readonly blocker: string | null;
  readonly completed: boolean;
  readonly finishedAt: string | null;
}

export type FlowAction =
  | { readonly type: "consent" }
  | { readonly type: "submit_screener"; readonly answers: ScreenerAnswers; readonly assignment: Assignment }
  | { readonly type: "start_task"; readonly index: TaskIndex; readonly at: string }
  | { readonly type: "log_search"; readonly index: TaskIndex; readonly search: Search }
  | { readonly type: "edit_draft"; readonly text: string }
  | {
      readonly type: "submit_answer";
      readonly index: TaskIndex;
      readonly answer: string;
      readonly gaveUp: boolean;
      readonly at: string;
    }
  | { readonly type: "submit_confidence"; readonly index: TaskIndex; readonly value: number }
  | {
      readonly type: "submit_final";
      readonly wouldUse: WouldUse;
      readonly blocker: string;
      readonly at: string;
    };

export function initialState(id: string): FlowState {
  return {
    version: 1,
    id,
    step: { name: "welcome" },
    screener: null,
    order: null,
    tasks: [],
    draft: "",
    wouldUse: null,
    blocker: null,
    completed: false,
    finishedAt: null,
  };
}

function emptyTask(assignment: Assignment["tasks"][number]): TaskRecord {
  return {
    condition: assignment.condition,
    scenario: assignment.scenario,
    started_at: null,
    ended_at: null,
    duration_sec: null,
    answer: null,
    gave_up: false,
    confidence: null,
    searches: [],
  };
}

function updateTask(
  state: FlowState,
  index: TaskIndex,
  update: (task: TaskRecord) => TaskRecord,
): readonly TaskRecord[] {
  return state.tasks.map((task, i) => (i === index ? update(task) : task));
}

/** Seconds between two ISO timestamps, rounded to 0.1s and never negative. */
export function secondsBetween(startIso: string, endIso: string): number {
  const ms = Date.parse(endIso) - Date.parse(startIso);
  return Math.max(0, Math.round(ms / 100) / 10);
}

function afterTask(index: TaskIndex): Step {
  return index === 0 ? { name: "task_intro", index: 1 } : { name: "final" };
}

export function advance(state: FlowState, action: FlowAction): FlowState {
  switch (action.type) {
    case "consent":
      return { ...state, step: { name: "screener" } };

    case "submit_screener": {
      if (!isEligible(action.answers)) {
        return { ...state, screener: action.answers, step: { name: "ineligible" } };
      }
      return {
        ...state,
        screener: action.answers,
        order: action.assignment.order,
        tasks: action.assignment.tasks.map(emptyTask),
        step: { name: "task_intro", index: 0 },
      };
    }

    case "start_task": {
      const current = state.tasks[action.index];
      // Keep the first start time if the participant reloads mid task.
      const startedAt = current?.started_at ?? action.at;
      return {
        ...state,
        tasks: updateTask(state, action.index, (t) => ({ ...t, started_at: startedAt })),
        draft: "",
        step: { name: "task", index: action.index },
      };
    }

    case "log_search":
      return {
        ...state,
        tasks: updateTask(state, action.index, (t) => ({
          ...t,
          searches: [...t.searches, action.search],
        })),
      };

    case "edit_draft":
      return { ...state, draft: action.text };

    case "submit_answer": {
      const answer = action.answer.trim();
      const tasks = updateTask(state, action.index, (t) => ({
        ...t,
        answer: answer === "" ? null : answer,
        gave_up: action.gaveUp,
        ended_at: action.at,
        duration_sec: t.started_at ? secondsBetween(t.started_at, action.at) : null,
      }));
      // A participant who found nothing has no answer to rate, so skip ahead.
      const step: Step = action.gaveUp
        ? afterTask(action.index)
        : { name: "confidence", index: action.index };
      return { ...state, tasks, draft: "", step };
    }

    case "submit_confidence":
      return {
        ...state,
        tasks: updateTask(state, action.index, (t) => ({ ...t, confidence: action.value })),
        step: afterTask(action.index),
      };

    case "submit_final": {
      const blocker = action.blocker.trim();
      return {
        ...state,
        wouldUse: action.wouldUse,
        blocker: blocker === "" ? null : blocker,
        completed: true,
        finishedAt: action.at,
        step: { name: "debrief" },
      };
    }
  }
}

/** Saves happen after the screener, after each answer and rating, and at the end. */
export function shouldSave(action: FlowAction): boolean {
  return (
    action.type === "submit_screener" ||
    action.type === "submit_answer" ||
    action.type === "submit_confidence" ||
    action.type === "submit_final"
  );
}

export function toPayload(state: FlowState): SessionPayload | null {
  if (!state.screener) return null;
  return {
    id: state.id,
    screener: state.screener,
    task_order: state.order,
    tasks: [...state.tasks],
    would_use: state.wouldUse,
    blocker: state.blocker,
    completed: state.completed,
    finished_at: state.finishedAt,
  };
}

const ORDERED_STEPS = [
  "welcome",
  "screener",
  "task_intro:0",
  "task:0",
  "confidence:0",
  "task_intro:1",
  "task:1",
  "confidence:1",
  "final",
  "debrief",
] as const;

export const TOTAL_STEPS = ORDERED_STEPS.length;

/** 1 based position of a step for the progress bar. */
export function stepNumber(step: Step): number {
  if (step.name === "ineligible") return TOTAL_STEPS;
  const key = "index" in step ? `${step.name}:${step.index}` : step.name;
  return ORDERED_STEPS.indexOf(key as (typeof ORDERED_STEPS)[number]) + 1;
}

export function isFlowState(value: unknown): value is FlowState {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Partial<FlowState>;
  return (
    v.version === 1 &&
    typeof v.id === "string" &&
    typeof v.step === "object" &&
    v.step !== null &&
    Array.isArray(v.tasks)
  );
}
