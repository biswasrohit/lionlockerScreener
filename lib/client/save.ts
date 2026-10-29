import type { SessionPayload } from "@/lib/session";

const RETRY_DELAYS_MS = [600, 1800];

type Fetcher = typeof fetch;
type Sleeper = (ms: number) => Promise<void>;

const sleep: Sleeper = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function postOnce(payload: SessionPayload, fetcher: Fetcher): Promise<boolean> {
  try {
    const res = await fetcher("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      // Lets the last save finish even if the participant closes the tab.
      keepalive: true,
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Posts a session snapshot, retrying a couple of times on failure. */
export async function postSession(
  payload: SessionPayload,
  fetcher: Fetcher = fetch,
  wait: Sleeper = sleep,
): Promise<boolean> {
  if (await postOnce(payload, fetcher)) return true;
  for (const delay of RETRY_DELAYS_MS) {
    await wait(delay);
    if (await postOnce(payload, fetcher)) return true;
  }
  return false;
}

/**
 * Runs saves one at a time in the order they were queued. Each save sends the
 * full snapshot, so a slow retry can never land after, and overwrite, a newer one.
 */
export function createSaveQueue(send: (payload: SessionPayload) => Promise<boolean>) {
  let tail: Promise<boolean> = Promise.resolve(true);
  return (payload: SessionPayload): Promise<boolean> => {
    tail = tail.then(() => send(payload));
    return tail;
  };
}
