import { CONDITIONS, type ConditionId, type ScenarioId } from "@/lib/study";
import { ScenarioCard } from "../ScenarioCard";
import { ScreenTitle } from "../ScreenTitle";

interface TaskIntroScreenProps {
  readonly taskNumber: number;
  readonly condition: ConditionId;
  readonly scenario: ScenarioId;
  readonly onStart: () => void;
}

export function TaskIntroScreen({ taskNumber, condition, scenario, onStart }: TaskIntroScreenProps) {
  return (
    <div className="sheet">
      <ScreenTitle eyebrow={`Task ${taskNumber} of 2`}>Here&apos;s your situation</ScreenTitle>
      <ScenarioCard scenario={scenario} />
      <section className="instructions" aria-label="How to find the answer">
        <span className="label">How to find the answer</span>
        <p>{CONDITIONS[condition].instructions}</p>
      </section>
      <p className="field-hint">
        A timer starts when you tap Start task. Take the time you need.
      </p>
      <div className="actions">
        <button type="button" className="btn btn-primary" onClick={onStart}>
          Start task
        </button>
      </div>
    </div>
  );
}
