import "server-only";
import { cookies } from "next/headers";
import { requireEnv } from "./env";
import { RESULTS_COOKIE, RESULTS_COOKIE_MAX_AGE_SEC, createToken, verifyToken } from "./auth-token";

export const RESULTS_COOKIE_PATH = "/results";

export async function isResultsAuthed(): Promise<boolean> {
  const token = (await cookies()).get(RESULTS_COOKIE)?.value;
  return verifyToken(requireEnv("RESULTS_PASSWORD"), token, Date.now());
}

/** Only call from a Server Function or Route Handler. */
export async function setResultsCookie(): Promise<void> {
  (await cookies()).set(RESULTS_COOKIE, createToken(requireEnv("RESULTS_PASSWORD"), Date.now()), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: RESULTS_COOKIE_PATH,
    maxAge: RESULTS_COOKIE_MAX_AGE_SEC,
  });
}

export async function clearResultsCookie(): Promise<void> {
  (await cookies()).delete({ name: RESULTS_COOKIE, path: RESULTS_COOKIE_PATH });
}
