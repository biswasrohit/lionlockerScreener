"use client";

import { useState } from "react";
import { PillGroup } from "@/components/ui/PillGroup";
import {
  SCREENER,
  type CarriesLaptop,
  type DaysOnCampus,
  type IsGrad,
  type ScreenerAnswers,
  type Source,
} from "@/lib/study";
import { ScreenTitle } from "../ScreenTitle";

interface Draft {
  readonly is_grad: IsGrad | null;
  readonly days_on_campus: DaysOnCampus | null;
  readonly carries_laptop: CarriesLaptop | null;
  readonly source: Source | null;
}

const EMPTY: Draft = { is_grad: null, days_on_campus: null, carries_laptop: null, source: null };

function complete(draft: Draft): ScreenerAnswers | null {
  const { is_grad, days_on_campus, carries_laptop, source } = draft;
  if (!is_grad || !days_on_campus || !carries_laptop || !source) return null;
  return { is_grad, days_on_campus, carries_laptop, source };
}

export function ScreenerScreen({ onSubmit }: { readonly onSubmit: (a: ScreenerAnswers) => void }) {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const answers = complete(draft);
  const set = <K extends keyof Draft>(key: K) => (value: NonNullable<Draft[K]>) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  return (
    <form
      className="sheet"
      onSubmit={(event) => {
        event.preventDefault();
        if (answers) onSubmit(answers);
      }}
    >
      <ScreenTitle eyebrow="A few quick questions">About you</ScreenTitle>

      <PillGroup
        name="is_grad"
        legend={SCREENER.is_grad.question}
        options={SCREENER.is_grad.options}
        value={draft.is_grad}
        onChange={set("is_grad")}
      />
      <PillGroup
        name="days_on_campus"
        legend={SCREENER.days_on_campus.question}
        options={SCREENER.days_on_campus.options}
        value={draft.days_on_campus}
        onChange={set("days_on_campus")}
      />
      <PillGroup
        name="carries_laptop"
        legend={SCREENER.carries_laptop.question}
        options={SCREENER.carries_laptop.options}
        value={draft.carries_laptop}
        onChange={set("carries_laptop")}
      />
      <PillGroup
        name="source"
        legend={SCREENER.source.question}
        options={SCREENER.source.options}
        value={draft.source}
        onChange={set("source")}
        layout="stack"
      />

      <div className="actions">
        <button type="submit" className="btn btn-primary" disabled={!answers}>
          Continue
        </button>
        {!answers ? (
          <p className="field-hint" style={{ textAlign: "center", marginTop: 4 }}>
            Answer all four to continue.
          </p>
        ) : null}
      </div>
    </form>
  );
}
