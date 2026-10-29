import { describe, expect, it, vi } from "vitest";
import type { SessionPayload } from "@/lib/session";
import { createSaveQueue, postSession } from "./save";

const payload = { id: "x" } as unknown as SessionPayload;
const noWait = () => Promise.resolve();
const response = (ok: boolean) => ({ ok }) as Response;

describe("postSession", () => {
  it("returns true on the first success", async () => {
    const fetcher = vi.fn().mockResolvedValue(response(true));
    expect(await postSession(payload, fetcher, noWait)).toBe(true);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0][0]).toBe("/api/session");
  });

  it("retries after errors and HTTP failures", async () => {
    const fetcher = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(response(false))
      .mockResolvedValueOnce(response(true));
    expect(await postSession(payload, fetcher, noWait)).toBe(true);
    expect(fetcher).toHaveBeenCalledTimes(3);
  });

  it("gives up after three attempts", async () => {
    const fetcher = vi.fn().mockResolvedValue(response(false));
    expect(await postSession(payload, fetcher, noWait)).toBe(false);
    expect(fetcher).toHaveBeenCalledTimes(3);
  });
});

describe("createSaveQueue", () => {
  it("sends saves strictly in order even when an earlier one is slow", async () => {
    const order: string[] = [];
    const send = vi.fn(async (p: SessionPayload) => {
      if (p.id === "first") await new Promise((r) => setTimeout(r, 20));
      order.push(p.id);
      return true;
    });
    const enqueue = createSaveQueue(send);
    const a = enqueue({ id: "first" } as SessionPayload);
    const b = enqueue({ id: "second" } as SessionPayload);
    await Promise.all([a, b]);
    expect(order).toEqual(["first", "second"]);
  });

  it("keeps going after a failed save", async () => {
    const send = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    const enqueue = createSaveQueue(send);
    expect(await enqueue(payload)).toBe(false);
    expect(await enqueue(payload)).toBe(true);
  });
});
