import {
  SESSION_STATE_LABEL,
  formatDuration,
  sessionState,
  taskFor,
} from "@/lib/results/stats";
import type { SessionRow } from "@/lib/results/types";
import { SCENARIOS, type ConditionId } from "@/lib/study";
import { ScoreToggle } from "./ScoreToggle";
import styles from "./results.module.css";

const SOURCE_LABEL: Record<string, string> = {
  team_member: "Team member",
  class_group: "Class group",
  friend: "Friend",
  other: "Other",
};

const ORDER_LABEL: Record<string, string> = {
  status_quo_first: "SQ first",
  prototype_first: "Proto first",
};

const CONDITIONS: readonly { id: ConditionId; label: string }[] = [
  { id: "status_quo", label: "Status quo" },
  { id: "prototype", label: "Prototype" },
];

function ConditionCells({
  row,
  condition,
  participant,
}: {
  row: SessionRow;
  condition: ConditionId;
  participant: string;
}) {
  const task = taskFor(row, condition);
  const finished = Boolean(task?.ended_at);
  const score = condition === "status_quo" ? row.score_status_quo : row.score_prototype;

  return (
    <>
      <td className={styles.groupStart}>{task ? SCENARIOS[task.scenario].title : ""}</td>
      <td className={styles.mono}>
        {finished && task ? (
          task.gave_up ? (
            <span className={styles.gaveUp}>Gave up {formatDuration(task.duration_sec)}</span>
          ) : (
            formatDuration(task.duration_sec)
          )
        ) : task?.started_at ? (
          <span className={styles.muted}>in progress</span>
        ) : (
          ""
        )}
      </td>
      <td className={styles.mono}>{task?.confidence ?? ""}</td>
      <td className={styles.answer}>
        {task?.answer ?? ""}
        {condition === "prototype" && task && task.searches.length > 0 ? (
          <span className={styles.searches}>
            {task.searches.length} search{task.searches.length === 1 ? "" : "es"}
          </span>
        ) : null}
      </td>
      <td>
        {finished ? (
          <ScoreToggle
            sessionId={row.id}
            condition={condition}
            participant={participant}
            initial={score}
          />
        ) : null}
      </td>
    </>
  );
}

export function ResultsTable({ rows }: { readonly rows: readonly SessionRow[] }) {
  if (rows.length === 0) {
    return <p className={styles.empty}>No sessions yet. Responses show up here as they come in.</p>;
  }

  return (
    <div className={styles.tableWrap} tabIndex={0} aria-label="Sessions table, scrolls sideways">
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col" rowSpan={2}>
              #
            </th>
            <th scope="col" rowSpan={2}>
              Source
            </th>
            <th scope="col" rowSpan={2}>
              State
            </th>
            <th scope="col" rowSpan={2}>
              Order
            </th>
            {CONDITIONS.map((c) => (
              <th key={c.id} scope="colgroup" colSpan={5} className={styles.groupStart}>
                {c.label}
              </th>
            ))}
            <th scope="col" rowSpan={2} className={styles.groupStart}>
              Would use
            </th>
            <th scope="col" rowSpan={2}>
              Blocker
            </th>
          </tr>
          <tr>
            {CONDITIONS.map((c) => (
              <ConditionHeaders key={c.id} />
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const participant = `P${index + 1}`;
            const state = sessionState(row);
            return (
              <tr key={row.id} data-state={state}>
                <th scope="row" className={styles.mono}>
                  {participant}
                </th>
                <td>{row.source ? (SOURCE_LABEL[row.source] ?? row.source) : ""}</td>
                <td>
                  <span className={styles.state} data-state={state}>
                    {SESSION_STATE_LABEL[state]}
                  </span>
                </td>
                <td className={styles.mono}>
                  {row.task_order ? (ORDER_LABEL[row.task_order] ?? row.task_order) : ""}
                </td>
                {CONDITIONS.map((c) => (
                  <ConditionCells key={c.id} row={row} condition={c.id} participant={participant} />
                ))}
                <td className={styles.groupStart}>{row.would_use ?? ""}</td>
                <td className={styles.answer}>{row.blocker ?? ""}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ConditionHeaders() {
  return (
    <>
      <th scope="col" className={styles.groupStart}>
        Scenario
      </th>
      <th scope="col">Time</th>
      <th scope="col">Conf.</th>
      <th scope="col">Answer</th>
      <th scope="col">Correct?</th>
    </>
  );
}
