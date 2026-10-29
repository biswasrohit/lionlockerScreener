import { describe, expect, it } from "vitest";
import { sessionPayloadSchema } from "@/lib/session";
import type { Assignment, ScreenerAnswers } from "@/lib/study";
import {
  TOTAL_STEPS,
  advance,
  initialState,
  isFlowState,
  secondsBetween,
  shouldSave,
  stepNumber,
  toPayload,
  type FlowAction,
  type FlowState,
} from "./flow";

const ID = "3f1c2b8e-6a0d-4b7e-9c51-0f8f2b8f5c11";
const eligible: ScreenerAnswers = {
  is_grad: "yes",
  days_on_campus: "5+",
  carries_laptop: "yes",
  source: "team_member",
};
const assignment: Assignment = {
  order: "prototype_first",
  tasks: [
    { condition: "prototype", scenario: "dodge" },
    { condition: "status_quo", scenario: "butler" },
  ],
};

const run = (actions: FlowAction[], from: FlowState = initialState(ID)) =>
  actions.reduce(advance, from);

const t = (sec: number) => new Date(Date.UTC(2026, 9, 29, 15, 0, sec)).toISOString();

describe("flow", () => {
  it("stops ineligible participants after the screener", () => {
    const s = run([
      { type: "consent" },
      { type: "submit_screener", answers: { ...eligible, carries_laptop: "no" }, assignment },
    ]);
    expect(s.step).toEqual({ name: "ineligible" });
    expect(s.tasks).toEqual([]);
    expect(s.order).toBeNull();
    expect(toPayload(s)).not.toBeNull();
  });

  it("walks an eligible participant through both tasks to the debrief", () => {
    const s = run([
      { type: "consent" },
      { type: "submit_screener", answers: eligible, assignment },
      { type: "start_task", index: 0, at: t(0) },
      { type: "log_search", index: 0, search: { building: "dodge", duration: "now", at_sec: 4.2 } },
      { type: "submit_answer", index: 0, answer: "  equipment room  ", gaveUp: false, at: t(42) },
      { type: "submit_confidence", index: 0, value: 4 },
      { type: "start_task", index: 1, at: t(50) },
      { type: "submit_answer", index: 1, answer: "lottery", gaveUp: false, at: t(110) },
      { type: "submit_confidence", index: 1, value: 2 },
      { type: "submit_final", wouldUse: "maybe", blocker: "  theft  ", at: t(130) },
    ]);

    expect(s.step).toEqual({ name: "debrief" });
    expect(s.order).toBe("prototype_first");
    expect(s.tasks[0]).toMatchObject({
      condition: "prototype",
      scenario: "dodge",
      answer: "equipment room",
      duration_sec: 42,
      confidence: 4,
      gave_up: false,
    });
    expect(s.tasks[0].searches).toHaveLength(1);
    expect(s.tasks[1]).toMatchObject({ duration_sec: 60, confidence: 2 });
    expect(s.completed).toBe(true);
    expect(s.blocker).toBe("theft");

    const payload = toPayload(s);
    expect(sessionPayloadSchema.safeParse(payload).success).toBe(true);
  });

  it("skips the confidence screen when the participant gives up", () => {
    const s = run([
      { type: "consent" },
      { type: "submit_screener", answers: eligible, assignment },
      { type: "start_task", index: 0, at: t(0) },
      { type: "submit_answer", index: 0, answer: "", gaveUp: true, at: t(30) },
    ]);
    expect(s.step).toEqual({ name: "task_intro", index: 1 });
    expect(s.tasks[0]).toMatchObject({ gave_up: true, answer: null, confidence: null, duration_sec: 30 });
  });

  it("goes to final questions when the second task is given up", () => {
    const s = run([
      { type: "consent" },
      { type: "submit_screener", answers: eligible, assignment },
      { type: "start_task", index: 1, at: t(0) },
      { type: "submit_answer", index: 1, answer: "", gaveUp: true, at: t(5) },
    ]);
    expect(s.step).toEqual({ name: "final" });
  });

  it("keeps the original start time if a task is started twice", () => {
    const s = run([
      { type: "submit_screener", answers: eligible, assignment },
      { type: "start_task", index: 0, at: t(0) },
      { type: "start_task", index: 0, at: t(20) },
    ]);
    expect(s.tasks[0].started_at).toBe(t(0));
  });

  it("does not mutate the previous state", () => {
    const before = run([{ type: "submit_screener", answers: eligible, assignment }]);
    const snapshot = JSON.stringify(before);
    advance(before, { type: "start_task", index: 0, at: t(0) });
    advance(before, { type: "edit_draft", text: "hello" });
    expect(JSON.stringify(before)).toBe(snapshot);
  });

  it("clears the draft when an answer is submitted", () => {
    const s = run([
      { type: "submit_screener", answers: eligible, assignment },
      { type: "start_task", index: 0, at: t(0) },
      { type: "edit_draft", text: "typing" },
    ]);
    expect(s.draft).toBe("typing");
    expect(advance(s, { type: "submit_answer", index: 0, answer: "typing", gaveUp: false, at: t(3) }).draft).toBe("");
  });
});

describe("helpers", () => {
  it("computes seconds between timestamps and never goes negative", () => {
    expect(secondsBetween(t(0), t(61))).toBe(61);
    expect(secondsBetween(t(10), t(0))).toBe(0);
  });

  it("saves only on meaningful transitions", () => {
    expect(shouldSave({ type: "consent" })).toBe(false);
    expect(shouldSave({ type: "edit_draft", text: "x" })).toBe(false);
    expect(shouldSave({ type: "submit_final", wouldUse: "yes", blocker: "", at: t(0) })).toBe(true);
  });

  it("returns no payload before the screener", () => {
    expect(toPayload(initialState(ID))).toBeNull();
  });

  it("numbers steps for the progress bar", () => {
    expect(stepNumber({ name: "welcome" })).toBe(1);
    expect(stepNumber({ name: "task", index: 1 })).toBe(7);
    expect(stepNumber({ name: "debrief" })).toBe(TOTAL_STEPS);
    expect(stepNumber({ name: "ineligible" })).toBe(TOTAL_STEPS);
  });

  it("recognizes stored flow state", () => {
    expect(isFlowState(initialState(ID))).toBe(true);
    expect(isFlowState(null)).toBe(false);
    expect(isFlowState({ version: 2 })).toBe(false);
  });
});
