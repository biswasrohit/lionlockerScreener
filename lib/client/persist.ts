// Keeps flow state in sessionStorage so a reload, or a phone browser that
// discards the tab while the participant searches elsewhere, resumes in place.
// Storage can be blocked (private mode, settings), so every call is guarded
// and the study still works without it.

import { initialState, isFlowState, type FlowState } from "./flow";

const KEY = "lionlocker:flow:v1";

export function loadOrCreate(newId: () => string): FlowState {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (isFlowState(parsed)) return parsed;
    }
  } catch {
    // Fall through to a fresh session.
  }
  return initialState(newId());
}

export function persist(state: FlowState): void {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Not fatal. The server already has every saved checkpoint.
  }
}
