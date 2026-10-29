"use client";

import { useState } from "react";
import { PillGroup } from "@/components/ui/PillGroup";
import { CONFIDENCE_SCALE } from "@/lib/study";
import { ScreenTitle } from "../ScreenTitle";

const OPTIONS = CONFIDENCE_SCALE.map((n) => ({ value: String(n), label: String(n) }));
const QUESTION = "How sure are you that this would work if you tried it today?";

interface ConfidenceScreenProps {
  readonly taskNumber: number;
  readonly onSubmit: (value: number) => void;
}

export function ConfidenceScreen({ taskNumber, onSubmit }: ConfidenceScreenProps) {
  const [value, setValue] = useState<string | null>(null);

  return (
    <form
      className="sheet"
      onSubmit={(event) => {
        event.preventDefault();
        if (value) onSubmit(Number(value));
      }}
    >
      <ScreenTitle eyebrow={`Task ${taskNumber} of 2 · Done`}>{QUESTION}</ScreenTitle>
      <div className="field">
        <PillGroup
          name="confidence"
          legend={QUESTION}
          legendHidden
          hint="1 = not at all sure, 5 = completely sure"
          options={OPTIONS}
          value={value}
          onChange={setValue}
          layout="scale"
        />
        <div className="scale-ends" aria-hidden="true">
          <span>Not at all sure</span>
          <span>Completely sure</span>
        </div>
      </div>
      <div className="actions">
        <button type="submit" className="btn btn-primary" disabled={!value}>
          Continue
        </button>
      </div>
    </form>
  );
}
