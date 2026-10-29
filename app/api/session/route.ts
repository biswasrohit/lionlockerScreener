import { NextResponse } from "next/server";
import { sessionPayloadSchema, toSessionWrite } from "@/lib/session";
import { upsertSession } from "@/lib/server/sessions-repo";
import { clientKey, createRateLimiter } from "@/lib/server/rate-limit";

const MAX_BODY_BYTES = 64 * 1024;
// A full session saves about 6 times, so this leaves plenty of room for retries.
const limiter = createRateLimiter(60, 60_000);

type ApiResponse = { success: true } | { success: false; error: string };

function reply(body: ApiResponse, status: number) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!limiter.check(clientKey(request.headers), Date.now())) {
    return reply({ success: false, error: "Too many requests. Please wait a moment." }, 429);
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return reply({ success: false, error: "Request too large." }, 413);
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return reply({ success: false, error: "Invalid JSON." }, 400);
  }

  const parsed = sessionPayloadSchema.safeParse(json);
  if (!parsed.success) {
    return reply({ success: false, error: "Invalid session data." }, 400);
  }

  try {
    await upsertSession(toSessionWrite(parsed.data));
    return reply({ success: true }, 200);
  } catch (error) {
    console.error("[api/session] save failed", { id: parsed.data.id, error });
    return reply({ success: false, error: "Could not save right now." }, 500);
  }
}
