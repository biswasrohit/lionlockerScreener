"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { SCORE_VALUES } from "@/lib/results/types";
import { passwordMatches } from "@/lib/server/auth-token";
import { requireEnv } from "@/lib/server/env";
import { clientKey, createRateLimiter } from "@/lib/server/rate-limit";
import {
  clearResultsCookie,
  isResultsAuthed,
  setResultsCookie,
} from "@/lib/server/results-auth";
import { setScore } from "@/lib/server/sessions-repo";
import { CONDITION_IDS } from "@/lib/study";

const loginLimiter = createRateLimiter(10, 5 * 60_000);

export interface LoginState {
  readonly error: string | null;
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  if (!loginLimiter.check(clientKey(await headers()), Date.now())) {
    return { error: "Too many attempts. Wait a few minutes and try again." };
  }
  const attempt = formData.get("password");
  if (typeof attempt !== "string" || attempt.length === 0 || attempt.length > 200) {
    return { error: "Enter the team password." };
  }
  if (!passwordMatches(requireEnv("RESULTS_PASSWORD"), attempt)) {
    return { error: "That password didn't work." };
  }
  await setResultsCookie();
  redirect("/results");
}

export async function logout(): Promise<void> {
  await clearResultsCookie();
  redirect("/results");
}

const scoreInput = z.object({
  sessionId: z.uuid(),
  condition: z.enum(CONDITION_IDS),
  score: z.enum(SCORE_VALUES).nullable(),
});

export type ScoreResult = { readonly ok: true } | { readonly ok: false; readonly error: string };

export async function updateScore(input: unknown): Promise<ScoreResult> {
  if (!(await isResultsAuthed())) {
    return { ok: false, error: "Your login expired. Reload the page." };
  }
  const parsed = scoreInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid score." };
  }
  try {
    await setScore(parsed.data.sessionId, parsed.data.condition, parsed.data.score);
    return { ok: true };
  } catch (error) {
    console.error("[results] score update failed", { input: parsed.data, error });
    return { ok: false, error: "Couldn't save. Try again." };
  }
}
