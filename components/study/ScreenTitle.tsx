import type { ReactNode } from "react";

export const SCREEN_TITLE_ID = "screen-title";

interface ScreenTitleProps {
  readonly eyebrow?: string;
  readonly children: ReactNode;
}

/** The h1 for each step. StudyFlow moves focus here when the step changes. */
export function ScreenTitle({ eyebrow, children }: ScreenTitleProps) {
  return (
    <div className="sheet-head">
      {eyebrow ? <span className="label">{eyebrow}</span> : null}
      <h1 id={SCREEN_TITLE_ID} tabIndex={-1}>
        {children}
      </h1>
    </div>
  );
}
