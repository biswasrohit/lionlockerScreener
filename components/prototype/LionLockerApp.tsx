"use client";

import { useEffect, useRef, useState } from "react";
import type { Search } from "@/lib/session";
import {
  BUILDINGS,
  DURATIONS,
  buildingLabel,
  findStorage,
  type BuildingId,
  type DurationId,
  type StorageLookup,
} from "@/lib/storage";
import { KeyTagCard, MessageTag } from "./KeyTagCard";
import styles from "./prototype.module.css";

const CHECKING_MS = 1000;

type Phase =
  | { readonly name: "idle" }
  | { readonly name: "checking"; readonly building: BuildingId }
  | { readonly name: "done"; readonly building: BuildingId; readonly lookup: StorageLookup };

interface LionLockerAppProps {
  /** ISO time the task started, used to log when each search happened. */
  readonly startedAt: string;
  readonly onSearch: (search: Search) => void;
}

/** The smoke and mirrors prototype. Every answer comes from lib/storage.ts. */
export function LionLockerApp({ startedAt, onSearch }: LionLockerAppProps) {
  const [building, setBuilding] = useState<BuildingId | null>(null);
  const [duration, setDuration] = useState<DurationId | null>(null);
  const [phase, setPhase] = useState<Phase>({ name: "idle" });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const canSearch = building !== null && duration !== null && phase.name !== "checking";

  function handleFind() {
    if (!building || !duration) return;
    const atSec = Math.max(0, Math.round((Date.now() - Date.parse(startedAt)) / 100) / 10);
    onSearch({ building, duration, at_sec: atSec });
    setPhase({ name: "checking", building });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setPhase({ name: "done", building, lookup: findStorage(building, duration) });
    }, CHECKING_MS);
  }

  return (
    <section className={styles.app} aria-label="LionLocker prototype">
      <div className={styles.appBar}>
        <span className={styles.appName}>
          <span className={styles.appKey} aria-hidden="true" />
          LionLocker
        </span>
        <span className={styles.appBadge}>Early version</span>
      </div>

      <AppChoice
        name="ll-building"
        legend="Where will you be?"
        options={BUILDINGS}
        value={building}
        onChange={setBuilding}
      />
      <AppChoice
        name="ll-duration"
        legend="For how long?"
        options={DURATIONS}
        value={duration}
        onChange={setDuration}
      />

      <button type="button" className={styles.find} onClick={handleFind} disabled={!canSearch}>
        Find storage
      </button>

      <div className={styles.results} aria-live="polite">
        {phase.name === "checking" ? (
          <p className={styles.checking}>
            <span className={styles.spinner} aria-hidden="true" />
            Checking campus storage near {buildingLabel(phase.building)}...
          </p>
        ) : null}
        {phase.name === "done" ? <Results lookup={phase.lookup} /> : null}
      </div>
    </section>
  );
}

function Results({ lookup }: { readonly lookup: StorageLookup }) {
  if (lookup.kind === "not_mapped") {
    return <MessageTag title="Not mapped yet" body="Butler and Dodge are ready to try." />;
  }
  if (lookup.kind === "none_for_duration") {
    return (
      <MessageTag
        title="Nothing here for that time"
        body="Nothing at this building for that time. Try another time option."
      />
    );
  }
  return (
    <>
      {lookup.cards.map((card) => (
        <KeyTagCard key={card.id} card={card} />
      ))}
    </>
  );
}

interface AppChoiceProps<T extends string> {
  readonly name: string;
  readonly legend: string;
  readonly options: readonly { readonly id: T; readonly label: string }[];
  readonly value: T | null;
  readonly onChange: (value: T) => void;
}

function AppChoice<T extends string>({ name, legend, options, value, onChange }: AppChoiceProps<T>) {
  return (
    <fieldset className={styles.choice}>
      <legend className={styles.choiceLegend}>{legend}</legend>
      <div className={styles.choiceList}>
        {options.map((option) => (
          <label key={option.id} className={styles.choicePill}>
            <input
              type="radio"
              name={name}
              value={option.id}
              checked={value === option.id}
              onChange={() => onChange(option.id)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
