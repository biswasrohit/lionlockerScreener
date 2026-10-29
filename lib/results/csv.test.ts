import { describe, expect, it } from "vitest";
import { CSV_HEADERS, csvCell, formatSearches, toCsv } from "./csv";
import { row, task } from "./fixtures";

describe("csvCell", () => {
  it("leaves plain values alone and blanks nulls", () => {
    expect(csvCell("hello")).toBe("hello");
    expect(csvCell(42)).toBe("42");
    expect(csvCell(false)).toBe("false");
    expect(csvCell(null)).toBe("");
    expect(csvCell(undefined)).toBe("");
  });

  it("quotes commas, quotes and newlines", () => {
    expect(csvCell('a, "b"')).toBe('"a, ""b"""');
    expect(csvCell("line1\nline2")).toBe('"line1\nline2"');
  });

  it("neutralizes spreadsheet formulas in text", () => {
    expect(csvCell("=HYPERLINK(1)")).toBe("'=HYPERLINK(1)");
    expect(csvCell("@cmd")).toBe("'@cmd");
    expect(csvCell("+1")).toBe("'+1");
  });
});

describe("toCsv", () => {
  const rows = [
    row({
      id: "a",
      completed: true,
      would_use: "yes",
      blocker: "theft, mostly",
      task_order: "prototype_first",
      score_prototype: "correct",
      tasks: [
        task({
          condition: "prototype",
          scenario: "dodge",
          searches: [{ building: "dodge", duration: "now", at_sec: 4.2 }],
        }),
        task({ condition: "status_quo", scenario: "butler", gave_up: true, answer: null }),
      ],
    }),
    row({ id: "b", eligible: false }),
  ];

  const lines = toCsv(rows).trimEnd().split("\r\n");
  const header = lines[0].split(",");
  const cell = (line: number, name: string) => {
    // Only safe for rows whose cells contain no commas before `name`.
    return lines[line].split(",")[header.indexOf(name)];
  };

  it("writes a header plus one line per session", () => {
    expect(lines).toHaveLength(3);
    expect(header).toEqual(CSV_HEADERS);
  });

  it("labels participants and fills per condition columns", () => {
    expect(cell(1, "participant")).toBe("P1");
    expect(cell(1, "order")).toBe("prototype_first");
    expect(cell(1, "proto_position")).toBe("1");
    expect(cell(1, "sq_position")).toBe("2");
    expect(cell(1, "proto_correct")).toBe("correct");
    expect(cell(1, "sq_gave_up")).toBe("true");
    expect(cell(1, "proto_searches")).toBe("dodge/now@4.2s");
    expect(lines[1].endsWith(',yes,"theft, mostly"')).toBe(true);
  });

  it("leaves task columns blank for ineligible sessions", () => {
    expect(cell(2, "participant")).toBe("P2");
    expect(cell(2, "state")).toBe("Ineligible");
    expect(cell(2, "sq_scenario")).toBe("");
  });
});

describe("formatSearches", () => {
  it("joins searches compactly", () => {
    expect(
      formatSearches([
        { building: "butler", duration: "semester", at_sec: 10 },
        { building: "mudd", duration: "now", at_sec: 22.5 },
      ]),
    ).toBe("butler/semester@10s; mudd/now@22.5s");
  });
});
