import { describe, expect, it } from "vitest";
import { RESULTS_COOKIE_MAX_AGE_SEC, createToken, passwordMatches, verifyToken } from "./auth-token";

const NOW = Date.UTC(2026, 9, 29, 15, 0, 0);

describe("results token", () => {
  it("verifies a fresh token with the same secret", () => {
    expect(verifyToken("s3cret", createToken("s3cret", NOW), NOW)).toBe(true);
  });

  it("does not contain the secret", () => {
    expect(createToken("s3cret", NOW)).not.toContain("s3cret");
  });

  it("rejects a token signed with another secret", () => {
    expect(verifyToken("other", createToken("s3cret", NOW), NOW)).toBe(false);
  });

  it("rejects an expired token", () => {
    const later = NOW + (RESULTS_COOKIE_MAX_AGE_SEC + 1) * 1000;
    expect(verifyToken("s3cret", createToken("s3cret", NOW), later)).toBe(false);
  });

  it("rejects a token whose expiry was edited", () => {
    const [exp, sig] = createToken("s3cret", NOW).split(".");
    expect(verifyToken("s3cret", `${Number(exp) + 999999}.${sig}`, NOW)).toBe(false);
  });

  it.each([undefined, "", "garbage", "1.2.3", "abc.def"])("rejects malformed token %s", (t) => {
    expect(verifyToken("s3cret", t, NOW)).toBe(false);
  });
});

describe("passwordMatches", () => {
  it("matches equal strings and rejects others of any length", () => {
    expect(passwordMatches("hunter2", "hunter2")).toBe(true);
    expect(passwordMatches("hunter2", "hunter3")).toBe(false);
    expect(passwordMatches("hunter2", "")).toBe(false);
    expect(passwordMatches("hunter2", "hunter2hunter2")).toBe(false);
  });
});
