import { describe, expect, it } from "vitest";
import { assignTasks, cryptoRandom, isEligible, type ScreenerAnswers } from "./study";

const base: ScreenerAnswers = {
  is_grad: "yes",
  days_on_campus: "3-4",
  carries_laptop: "yes",
  source: "friend",
};

describe("isEligible", () => {
  it("accepts grad students who carry a laptop and are on campus", () => {
    expect(isEligible(base)).toBe(true);
    expect(isEligible({ ...base, days_on_campus: "1-2" })).toBe(true);
    expect(isEligible({ ...base, days_on_campus: "5+" })).toBe(true);
  });

  it("rejects non-grads, no laptop, or zero days", () => {
    expect(isEligible({ ...base, is_grad: "no" })).toBe(false);
    expect(isEligible({ ...base, carries_laptop: "no" })).toBe(false);
    expect(isEligible({ ...base, days_on_campus: "0" })).toBe(false);
  });
});

const sequence = (...values: number[]) => {
  let i = 0;
  return () => values[i++];
};

describe("assignTasks", () => {
  it("puts status quo first with dodge when both flips are high", () => {
    expect(assignTasks(sequence(0.9, 0.1))).toEqual({
      order: "status_quo_first",
      tasks: [
        { condition: "status_quo", scenario: "dodge" },
        { condition: "prototype", scenario: "butler" },
      ],
    });
  });

  it("puts prototype first and pairs it with dodge", () => {
    expect(assignTasks(sequence(0.1, 0.9))).toEqual({
      order: "prototype_first",
      tasks: [
        { condition: "prototype", scenario: "dodge" },
        { condition: "status_quo", scenario: "butler" },
      ],
    });
  });

  it("always covers both conditions and both scenarios", () => {
    for (let n = 0; n < 50; n++) {
      const { tasks } = assignTasks(cryptoRandom);
      expect(new Set(tasks.map((t) => t.condition)).size).toBe(2);
      expect(new Set(tasks.map((t) => t.scenario)).size).toBe(2);
    }
  });

  it("produces all four combinations over many draws", () => {
    const seen = new Set<string>();
    for (let n = 0; n < 400; n++) {
      const a = assignTasks(cryptoRandom);
      seen.add(`${a.order}:${a.tasks[0].scenario}`);
    }
    expect(seen.size).toBe(4);
  });
});

describe("cryptoRandom", () => {
  it("returns values in [0, 1)", () => {
    for (let n = 0; n < 100; n++) {
      const r = cryptoRandom();
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThan(1);
    }
  });
});
