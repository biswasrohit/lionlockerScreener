"use client";

import { useState } from "react";
import { PillGroup } from "@/components/ui/PillGroup";
import { MAX_BLOCKER_LENGTH, WOULD_USE_OPTIONS, type WouldUse } from "@/lib/study";
import { ScreenTitle } from "../ScreenTitle";

interface FinalScreenProps {
  readonly onSubmit: (wouldUse: WouldUse, blocker: string) => void;
}

export function FinalScreen({ onSubmit }: FinalScreenProps) {
  const [wouldUse, setWouldUse] = useState<WouldUse | null>(null);
  const [blocker, setBlocker] = useState("");

  return (
    <form
      className="sheet"
      onSubmit={(event) => {
        event.preventDefault();
        if (wouldUse) onSubmit(wouldUse, blocker);
      }}
    >
      <ScreenTitle eyebrow="Last two questions">Almost done</ScreenTitle>

      <PillGroup
        name="would_use"
        legend="If a tool like LionLocker existed, would you actually leave something in campus storage this week?"
        options={WOULD_USE_OPTIONS}
        value={wouldUse}
        onChange={setWouldUse}
      />

      <div className="field">
        <label className="field-label" htmlFor="blocker">
          What would stop you from leaving your laptop in campus storage?{" "}
          <span className="field-hint">(optional)</span>
        </label>
        <textarea
          id="blocker"
          className="textarea"
          value={blocker}
          maxLength={MAX_BLOCKER_LENGTH}
          onChange={(event) => setBlocker(event.target.value)}
        />
      </div>

      <div className="actions">
        <button type="submit" className="btn btn-primary" disabled={!wouldUse}>
          Finish
        </button>
      </div>
    </form>
  );
}
