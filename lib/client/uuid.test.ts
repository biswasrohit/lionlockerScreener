import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { newSessionId } from "./uuid";

const isUuid = (value: string) => z.uuid().safeParse(value).success;

describe("newSessionId", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("returns a valid uuid", () => {
    expect(isUuid(newSessionId())).toBe(true);
  });

  it("falls back to getRandomValues when randomUUID is missing", () => {
    vi.stubGlobal("crypto", { getRandomValues: crypto.getRandomValues.bind(crypto) });
    const id = newSessionId();
    expect(isUuid(id)).toBe(true);
    expect(id[14]).toBe("4");
  });
});
