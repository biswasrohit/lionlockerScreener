"use client";

import { useState } from "react";
import { LionLockerApp } from "@/components/prototype/LionLockerApp";
import type { Search, TaskRecord } from "@/lib/session";
import { MAX_ANSWER_LENGTH, MIN_ANSWER_LENGTH } from "@/lib/study";
import { ScenarioCard } from "../ScenarioCard";
import { SCREEN_TITLE_ID } from "../ScreenTitle";
import { TaskTimer } from "../TaskTimer";

const ANSWER_PROMPT =
  "What would you do? Where would you leave your things, and how would you get access?";

interface TaskScreenProps {
  readonly taskNumber: number;
  readonly task: TaskRecord & { readonly started_at: string };
  readonly draft: string;
  readonly onDraft: (text: string) => void;
  readonly onSearch: (search: Search) => void;
  readonly onSubmit: (answer: string, gaveUp: boolean) => void;
}

export function TaskScreen({ taskNumber, task, draft, onDraft, onSearch, onSubmit }: TaskScreenProps) {
  const [confirmingGiveUp, setConfirmingGiveUp] = useState(false);
  const isPrototype = task.condition === "prototype";
  const canSubmit = draft.trim().length >= MIN_ANSWER_LENGTH;

  return (
    <div className="sheet">
      <div className="task-bar">
        <h1 id={SCREEN_TITLE_ID} tabIndex={-1} className="label" style={{ fontSize: "0.8rem" }}>
          Task {taskNumber} of 2
        </h1>
        <TaskTimer startedAt={task.started_at} />
      </div>

      <ScenarioCard scenario={task.scenario} />

      {isPrototype ? (
        <LionLockerApp startedAt={task.started_at} onSearch={onSearch} />
      ) : (
        <p className="instructions">
          Search however you normally would. Switch tabs freely, then come back here and type what
          you found. The timer keeps running.
        </p>
      )}

      <form
        className="field"
        onSubmit={(event) => {
          event.preventDefault();
          if (canSubmit) onSubmit(draft, false);
        }}
      >
        <label className="field-label" htmlFor="answer">
          {ANSWER_PROMPT}
        </label>
        <textarea
          id="answer"
          className="textarea"
          value={draft}
          maxLength={MAX_ANSWER_LENGTH}
          onChange={(event) => onDraft(event.target.value)}
          placeholder="Type your answer here"
        />
        <div className="actions">
          <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
            That&apos;s my answer
          </button>
          {confirmingGiveUp ? (
            <div className="instructions" role="group" aria-label="Confirm you couldn't find an answer">
              <p>This ends the task. Is that right?</p>
              <button type="button" className="btn btn-secondary" onClick={() => onSubmit(draft, true)}>
                Yes, I couldn&apos;t find it
              </button>
              <button type="button" className="btn-link" onClick={() => setConfirmingGiveUp(false)}>
                Keep looking
              </button>
            </div>
          ) : (
            <button type="button" className="btn-link" onClick={() => setConfirmingGiveUp(true)}>
              I couldn&apos;t find an answer
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
