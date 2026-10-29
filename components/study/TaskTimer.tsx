"use client";

import { useEffect, useState } from "react";

const TICK_MS = 250;

export function formatElapsed(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Shows time since `startedAt`. The interval only triggers a re-render; the
 * value always comes from timestamps, so it stays right across tab switches.
 */
export function TaskTimer({ startedAt }: { readonly startedAt: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(id);
  }, []);

  const elapsed = (now - Date.parse(startedAt)) / 1000;

  return (
    <span className="timer" role="timer" aria-label="Time on this task">
      <span className="timer-dot" aria-hidden="true" />
      {formatElapsed(elapsed)}
    </span>
  );
}
