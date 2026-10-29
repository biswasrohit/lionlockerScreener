"use client";

import { useEffect, useRef, useState } from "react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  TOTAL_STEPS,
  advance,
  shouldSave,
  stepNumber,
  toPayload,
  type FlowAction,
  type FlowState,
  type Step,
} from "@/lib/client/flow";
import { loadOrCreate, persist } from "@/lib/client/persist";
import { createSaveQueue, postSession } from "@/lib/client/save";
import { newSessionId } from "@/lib/client/uuid";
import { assignTasks, cryptoRandom } from "@/lib/study";
import { SCREEN_TITLE_ID } from "./ScreenTitle";
import { ConfidenceScreen } from "./screens/ConfidenceScreen";
import { DebriefScreen, IneligibleScreen } from "./screens/EndScreens";
import { FinalScreen } from "./screens/FinalScreen";
import { ScreenerScreen } from "./screens/ScreenerScreen";
import { TaskIntroScreen } from "./screens/TaskIntroScreen";
import { TaskScreen } from "./screens/TaskScreen";
import { WelcomeScreen } from "./screens/WelcomeScreen";

function stepKey(step: Step): string {
  return "index" in step ? `${step.name}:${step.index}` : step.name;
}

export default function StudyFlow() {
  const [state, setState] = useState<FlowState>(() => loadOrCreate(newSessionId));
  const [saveFailed, setSaveFailed] = useState(false);
  const latest = useRef(state);
  const [enqueueSave] = useState(() => createSaveQueue((payload) => postSession(payload)));

  const save = (snapshot: FlowState) => {
    const payload = toPayload(snapshot);
    if (!payload) return;
    void enqueueSave(payload).then((ok) => setSaveFailed(!ok));
  };

  const dispatch = (action: FlowAction) => {
    const next = advance(latest.current, action);
    latest.current = next;
    setState(next);
    persist(next);
    if (shouldSave(action)) save(next);
  };

  // Move focus to the new screen's heading so screen readers announce it.
  const key = stepKey(state.step);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo({ top: 0 });
    document.getElementById(SCREEN_TITLE_ID)?.focus({ preventScroll: true });
  }, [key]);

  const now = () => new Date().toISOString();
  const retry = () => save(latest.current);

  return (
    <>
      <ProgressBar current={stepNumber(state.step)} total={TOTAL_STEPS} />
      <main>
        <CurrentStep state={state} dispatch={dispatch} now={now} saveFailed={saveFailed} onRetry={retry} />
      </main>
    </>
  );
}

interface CurrentStepProps {
  readonly state: FlowState;
  readonly dispatch: (action: FlowAction) => void;
  readonly now: () => string;
  readonly saveFailed: boolean;
  readonly onRetry: () => void;
}

function CurrentStep({ state, dispatch, now, saveFailed, onRetry }: CurrentStepProps) {
  const { step } = state;

  switch (step.name) {
    case "welcome":
      return <WelcomeScreen onConsent={() => dispatch({ type: "consent" })} />;

    case "screener":
      return (
        <ScreenerScreen
          onSubmit={(answers) =>
            dispatch({ type: "submit_screener", answers, assignment: assignTasks(cryptoRandom) })
          }
        />
      );

    case "ineligible":
      return <IneligibleScreen saveFailed={saveFailed} onRetry={onRetry} />;

    case "task_intro": {
      const task = state.tasks[step.index];
      return (
        <TaskIntroScreen
          taskNumber={step.index + 1}
          condition={task.condition}
          scenario={task.scenario}
          onStart={() => dispatch({ type: "start_task", index: step.index, at: now() })}
        />
      );
    }

    case "task": {
      const task = state.tasks[step.index];
      const startedAt = task.started_at;
      if (!startedAt) {
        return (
          <TaskIntroScreen
            taskNumber={step.index + 1}
            condition={task.condition}
            scenario={task.scenario}
            onStart={() => dispatch({ type: "start_task", index: step.index, at: now() })}
          />
        );
      }
      return (
        <TaskScreen
          key={step.index}
          taskNumber={step.index + 1}
          task={{ ...task, started_at: startedAt }}
          draft={state.draft}
          onDraft={(text) => dispatch({ type: "edit_draft", text })}
          onSearch={(search) => dispatch({ type: "log_search", index: step.index, search })}
          onSubmit={(answer, gaveUp) =>
            dispatch({ type: "submit_answer", index: step.index, answer, gaveUp, at: now() })
          }
        />
      );
    }

    case "confidence":
      return (
        <ConfidenceScreen
          key={step.index}
          taskNumber={step.index + 1}
          onSubmit={(value) => dispatch({ type: "submit_confidence", index: step.index, value })}
        />
      );

    case "final":
      return (
        <FinalScreen
          onSubmit={(wouldUse, blocker) =>
            dispatch({ type: "submit_final", wouldUse, blocker, at: now() })
          }
        />
      );

    case "debrief":
      return <DebriefScreen saveFailed={saveFailed} onRetry={onRetry} />;
  }
}
