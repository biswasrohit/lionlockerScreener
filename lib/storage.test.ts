import { describe, expect, it } from "vitest";
import { STORAGE_CARDS, buildingLabel, durationLabel, findStorage } from "./storage";

const ids = (lookup: ReturnType<typeof findStorage>) =>
  lookup.kind === "results" ? lookup.cards.map((c) => c.id) : [];

describe("findStorage", () => {
  it("returns the Dodge daily locker for now and later today", () => {
    expect(ids(findStorage("dodge", "now"))).toEqual(["dodge-daily-locker"]);
    expect(ids(findStorage("dodge", "later_today"))).toEqual(["dodge-daily-locker"]);
  });

  it("returns the Dodge overnight box for the rest of the semester", () => {
    expect(ids(findStorage("dodge", "semester"))).toEqual(["dodge-overnight-box"]);
  });

  it("returns the Butler grad locker for the semester and day storage otherwise", () => {
    expect(ids(findStorage("butler", "semester"))).toEqual(["butler-grad-locker"]);
    expect(ids(findStorage("butler", "now"))).toEqual(["butler-day-storage"]);
  });

  it.each(["lerner", "mudd", "uris"] as const)("marks %s as not mapped", (building) => {
    expect(findStorage(building, "now")).toEqual({ kind: "not_mapped" });
  });

  it("reports none_for_duration when a mapped building has no card for that time", () => {
    const onlyDaily = STORAGE_CARDS.filter((c) => c.id === "dodge-daily-locker");
    expect(findStorage("dodge", "semester", onlyDaily)).toEqual({ kind: "none_for_duration" });
  });
});

describe("labels", () => {
  it("maps ids to display labels", () => {
    expect(buildingLabel("dodge")).toBe("Dodge Fitness Center");
    expect(durationLabel("semester")).toBe("Rest of the semester");
  });
});

describe("storage copy", () => {
  it("never uses em dashes", () => {
    const text = JSON.stringify(STORAGE_CARDS);
    expect(text).not.toContain("—");
  });

  it("links only to columbia.edu sources over https", () => {
    for (const card of STORAGE_CARDS) {
      for (const source of card.sources) {
        expect(source.url).toMatch(/^https:\/\/[a-z.]+\.columbia\.edu\//);
      }
    }
  });
});
