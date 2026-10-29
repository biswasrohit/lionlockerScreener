"use client";

import type { ReactNode } from "react";

export interface PillOption<T extends string> {
  readonly value: T;
  readonly label: string;
}

interface PillGroupProps<T extends string> {
  readonly name: string;
  readonly legend: ReactNode;
  readonly hint?: ReactNode;
  readonly options: readonly PillOption<T>[];
  readonly value: T | null;
  readonly onChange: (value: T) => void;
  readonly layout?: "row" | "stack" | "scale";
  readonly legendHidden?: boolean;
}

/** Native radio buttons styled as pills, so keyboard and screen readers just work. */
export function PillGroup<T extends string>({
  name,
  legend,
  hint,
  options,
  value,
  onChange,
  layout = "row",
  legendHidden = false,
}: PillGroupProps<T>) {
  const listClass =
    layout === "stack" ? "pills pills--stack" : layout === "scale" ? "pills scale" : "pills";
  const hintId = hint ? `${name}-hint` : undefined;

  return (
    <fieldset className="field" aria-describedby={hintId}>
      <legend className={legendHidden ? "visually-hidden" : undefined}>{legend}</legend>
      {hint ? (
        <p className="field-hint" id={hintId}>
          {hint}
        </p>
      ) : null}
      <div className={listClass}>
        {options.map((option) => (
          <label className="pill" key={option.value}>
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
