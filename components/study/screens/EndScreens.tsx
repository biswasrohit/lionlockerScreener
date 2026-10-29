import { ScreenTitle } from "../ScreenTitle";

interface SaveStatusProps {
  readonly saveFailed: boolean;
  readonly onRetry: () => void;
}

function SaveRetry({ saveFailed, onRetry }: SaveStatusProps) {
  if (!saveFailed) return null;
  return (
    <div className="notice" role="alert">
      <p>We couldn&apos;t save your answers. Check your connection and try again.</p>
      <button type="button" className="btn btn-secondary" style={{ marginTop: 10 }} onClick={onRetry}>
        Try saving again
      </button>
    </div>
  );
}

export function IneligibleScreen(props: SaveStatusProps) {
  return (
    <div className="sheet">
      <ScreenTitle eyebrow="Thank you">Thanks for your time</ScreenTitle>
      <p className="lede">
        This study is looking for Columbia grad students who carry a laptop to campus most weeks, so
        we won&apos;t ask you anything else.
      </p>
      <p>We really appreciate you stopping by. You can close this page now.</p>
      <SaveRetry {...props} />
    </div>
  );
}

export function DebriefScreen(props: SaveStatusProps) {
  return (
    <div className="sheet">
      <ScreenTitle eyebrow="All done">Thank you!</ScreenTitle>
      <p className="lede">Your answers help our team figure out if this idea is worth building.</p>
      <section className="scenario" aria-label="About what you saw">
        <span className="label">About what you saw</span>
        <p>
          LionLocker isn&apos;t a working app yet. The storage info you saw was gathered and checked
          by hand by our team from Columbia&apos;s official pages.
        </p>
      </section>
      <p>You can close this page now.</p>
      <SaveRetry {...props} />
    </div>
  );
}
