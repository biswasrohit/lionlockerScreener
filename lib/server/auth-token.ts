// Signed, expiring token for the /results cookie. Pure functions so they can
// be unit tested without Next.js. The cookie never contains the password.

import { createHmac, timingSafeEqual } from "node:crypto";

export const RESULTS_COOKIE = "ll_results";
export const RESULTS_COOKIE_MAX_AGE_SEC = 7 * 24 * 60 * 60;
const CONTEXT = "lionlocker-results:v1";

function sign(secret: string, expiresAt: number): string {
  return createHmac("sha256", secret).update(`${CONTEXT}:${expiresAt}`).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function createToken(secret: string, nowMs: number): string {
  const expiresAt = Math.floor(nowMs / 1000) + RESULTS_COOKIE_MAX_AGE_SEC;
  return `${expiresAt}.${sign(secret, expiresAt)}`;
}

export function verifyToken(secret: string, token: string | undefined, nowMs: number): boolean {
  if (!token) return false;
  const [expiresRaw, signature, ...rest] = token.split(".");
  if (!expiresRaw || !signature || rest.length > 0) return false;
  const expiresAt = Number(expiresRaw);
  if (!Number.isInteger(expiresAt) || expiresAt * 1000 <= nowMs) return false;
  return safeEqual(signature, sign(secret, expiresAt));
}

/** Constant time password check. Hashing first equalizes lengths. */
export function passwordMatches(expected: string, attempt: string): boolean {
  const digest = (value: string) => createHmac("sha256", CONTEXT).update(value).digest("hex");
  return safeEqual(digest(expected), digest(attempt));
}
