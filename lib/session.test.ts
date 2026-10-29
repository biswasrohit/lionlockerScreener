import { describe, expect, it } from "vitest";
import { sessionPayloadSchema, toSessionWrite, type SessionPayload } from "./session";

const payload: SessionPayload = {
  id: "3f1c2b8e-6a0d-4b7e-9c51-0f8f2b8f5c11",
  screener: { is_grad: "yes", days_on_campus: "3-4", carries_laptop: "yes", source: "friend" },
  task_order: "prototype_first",
  tasks: [
    {
      condition: "prototype",
      scenario: "dodge",
      started_at: "2026-10-29T15:00:00.000Z",
      ended_at: "2026-10-29T15:01:30.000Z",
      duration_sec: 90,
      answer: "Equipment room with CUID",
      gave_up: false,
      confidence: 4,
      searches: [{ building: "dodge", duration: "now", at_sec: 12.4 }],
    },
    {
      condition: "status_quo",
      scenario: "butler",
      started_at: null,
      ended_at: null,
      duration_sec: null,
      answer: null,
      gave_up: false,
      confidence: null,
      searches: [{ building: "butler", duration: "now", at_sec: 3 }],
    },
  ],
  would_use: null,
  blocker: "   ",
  completed: false,
  finished_at: "2026-10-29T15:05:00.000Z",
};

describe("sessionPayloadSchema", () => {
  it("accepts a well formed payload", () => {
    expect(sessionPayloadSchema.safeParse(payload).success).toBe(true);
  });

  it("rejects unknown keys so clients can't write team score columns", () => {
    const result = sessionPayloadSchema.safeParse({ ...payload, score_prototype: "correct" });
    expect(result.success).toBe(false);
  });

  it("rejects a non uuid id", () => {
    expect(sessionPayloadSchema.safeParse({ ...payload, id: "abc" }).success).toBe(false);
  });

  it("rejects out of range confidence", () => {
    const bad = { ...payload, tasks: [{ ...payload.tasks[0], confidence: 6 }] };
    expect(sessionPayloadSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects more than two tasks", () => {
    const bad = { ...payload, tasks: [...payload.tasks, payload.tasks[0]] };
    expect(sessionPayloadSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects an overlong answer", () => {
    const bad = { ...payload, tasks: [{ ...payload.tasks[0], answer: "x".repeat(4001) }] };
    expect(sessionPayloadSchema.safeParse(bad).success).toBe(false);
  });
});

describe("toSessionWrite", () => {
  it("flattens the screener and recomputes eligibility", () => {
    const row = toSessionWrite(payload);
    expect(row.is_grad).toBe("yes");
    expect(row.source).toBe("friend");
    expect(row.eligible).toBe(true);
    expect(toSessionWrite({ ...payload, screener: { ...payload.screener, days_on_campus: "0" } }).eligible).toBe(false);
  });

  it("drops searches from status quo tasks only", () => {
    const row = toSessionWrite(payload);
    expect(row.tasks[0].searches).toHaveLength(1);
    expect(row.tasks[1].searches).toEqual([]);
  });

  it("does not mutate the input payload", () => {
    toSessionWrite(payload);
    expect(payload.tasks[1].searches).toHaveLength(1);
  });

  it("stores blank blockers as null and only keeps finished_at when completed", () => {
    const row = toSessionWrite(payload);
    expect(row.blocker).toBeNull();
    expect(row.finished_at).toBeNull();
    const done = toSessionWrite({ ...payload, completed: true, blocker: " cost " });
    expect(done.blocker).toBe("cost");
    expect(done.finished_at).toBe(payload.finished_at);
  });
});
