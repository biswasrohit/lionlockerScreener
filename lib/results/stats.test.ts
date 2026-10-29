import { describe, expect, it } from "vitest";
import { row, task } from "./fixtures";
import { formatDuration, median, sessionState, summarize, taskPosition } from "./stats";

describe("median", () => {
  it("handles empty, odd and even lists without mutating input", () => {
    const input = [5, 1, 3];
    expect(median([])).toBeNull();
    expect(median(input)).toBe(3);
    expect(median([4, 1, 3, 2])).toBe(2.5);
    expect(input).toEqual([5, 1, 3]);
  });
});

describe("summarize", () => {
  const rows = [
    row({ eligible: false, is_grad: "no" }),
    row({
      completed: true,
      would_use: "yes",
      tasks: [
        task({ condition: "status_quo", duration_sec: 100, confidence: 2 }),
        task({ condition: "prototype", duration_sec: 30, confidence: 5 }),
      ],
    }),
    row({
      completed: true,
      would_use: "maybe",
      tasks: [
        task({ condition: "prototype", duration_sec: 50, confidence: 4 }),
        task({ condition: "status_quo", duration_sec: 400, gave_up: true, confidence: null, answer: null }),
      ],
    }),
    row({
      tasks: [
        task({ condition: "status_quo", duration_sec: 200, confidence: 3 }),
        task({ condition: "prototype", started_at: null, ended_at: null, duration_sec: null, confidence: null }),
      ],
    }),
  ];

  const summary = summarize(rows);

  it("counts started, eligible, completed and would use yes", () => {
    expect(summary.started).toBe(4);
    expect(summary.eligible).toBe(3);
    expect(summary.completed).toBe(2);
    expect(summary.wouldUseYes).toBe(1);
  });

  it("excludes give ups from median time", () => {
    expect(summary.byCondition.status_quo.medianTimeSec).toBe(150);
    expect(summary.byCondition.status_quo.timedCount).toBe(2);
    expect(summary.byCondition.status_quo.gaveUpCount).toBe(1);
    expect(summary.byCondition.prototype.medianTimeSec).toBe(40);
  });

  it("computes median confidence per condition and ignores unfinished tasks", () => {
    expect(summary.byCondition.status_quo.medianConfidence).toBe(2.5);
    expect(summary.byCondition.prototype.medianConfidence).toBe(4.5);
    expect(summary.byCondition.prototype.ratedCount).toBe(2);
  });

  it("returns nulls when nothing is recorded", () => {
    const empty = summarize([]);
    expect(empty.byCondition.prototype.medianTimeSec).toBeNull();
    expect(empty.byCondition.prototype.medianConfidence).toBeNull();
  });
});

describe("sessionState and position", () => {
  it("labels each kind of session", () => {
    expect(sessionState(row({ eligible: false }))).toBe("ineligible");
    expect(sessionState(row({ completed: true }))).toBe("completed");
    expect(sessionState(row({ tasks: [task({})] }))).toBe("partial");
    expect(sessionState(row({ tasks: [task({ ended_at: null })] }))).toBe("screened");
  });

  it("finds the position of a condition", () => {
    const r = row({ tasks: [task({ condition: "prototype" }), task({ condition: "status_quo" })] });
    expect(taskPosition(r, "prototype")).toBe(1);
    expect(taskPosition(r, "status_quo")).toBe(2);
    expect(taskPosition(row({}), "prototype")).toBeNull();
  });
});

describe("formatDuration", () => {
  it("formats minutes and seconds", () => {
    expect(formatDuration(null)).toBe("");
    expect(formatDuration(5)).toBe("0:05");
    expect(formatDuration(125.6)).toBe("2:06");
  });
});
