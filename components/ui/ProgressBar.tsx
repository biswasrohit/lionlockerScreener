interface ProgressBarProps {
  readonly current: number;
  readonly total: number;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const percent = Math.round((current / total) * 100);
  return (
    <div className="progress">
      <div className="progress-meta">
        <span className="label">Concept test</span>
        <span className="label">
          Step {current} of {total}
        </span>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-label="Study progress"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={current}
        aria-valuetext={`Step ${current} of ${total}`}
      >
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
