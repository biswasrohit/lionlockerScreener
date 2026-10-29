import "server-only";
import type { SessionWrite } from "@/lib/session";
import type { ConditionId } from "@/lib/study";
import { scoreColumn, type Score, type SessionRow } from "@/lib/results/types";
import { getSupabaseAdmin } from "./supabase";

const TABLE = "sessions";

export class RepoError extends Error {
  constructor(operation: string, cause: { message: string; code?: string }) {
    super(`sessions.${operation} failed: ${cause.message}${cause.code ? ` (${cause.code})` : ""}`);
    this.name = "RepoError";
  }
}

/** Insert or update a participant session. Never touches created_at or team scores. */
export async function upsertSession(row: SessionWrite): Promise<void> {
  const { error } = await getSupabaseAdmin().from(TABLE).upsert(row, { onConflict: "id" });
  if (error) throw new RepoError("upsert", error);
}

export async function listSessions(): Promise<SessionRow[]> {
  const { data, error } = await getSupabaseAdmin()
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw new RepoError("list", error);
  return (data ?? []) as SessionRow[];
}

export async function setScore(
  sessionId: string,
  condition: ConditionId,
  score: Score | null,
): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from(TABLE)
    .update({ [scoreColumn(condition)]: score })
    .eq("id", sessionId);
  if (error) throw new RepoError("setScore", error);
}
