import type { Search } from "@/lib/session";
import type { ConditionId } from "@/lib/study";
import { SESSION_STATE_LABEL, sessionState, taskFor, taskPosition } from "./stats";
import { scoreColumn, type SessionRow } from "./types";

type Cell = string | number | boolean | null | undefined;

// Spreadsheet apps run cells that start with these as formulas.
const FORMULA_START = /^[=+\-@\t\r]/;

export function csvCell(value: Cell): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  const safe = typeof value === "string" && FORMULA_START.test(text) ? `'${text}` : text;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function formatSearches(searches: readonly Search[]): string {
  return searches.map((s) => `${s.building}/${s.duration}@${s.at_sec}s`).join("; ");
}

const CONDITION_PREFIX: Record<ConditionId, string> = { status_quo: "sq", prototype: "proto" };

function conditionHeaders(condition: ConditionId): string[] {
  const p = CONDITION_PREFIX[condition];
  const headers = [
    `${p}_position`,
    `${p}_scenario`,
    `${p}_started_at`,
    `${p}_ended_at`,
    `${p}_duration_sec`,
    `${p}_gave_up`,
    `${p}_confidence`,
    `${p}_answer`,
    `${p}_correct`,
  ];
  return condition === "prototype" ? [...headers, `${p}_searches`] : headers;
}

function conditionCells(row: SessionRow, condition: ConditionId): Cell[] {
  const task = taskFor(row, condition);
  const cells: Cell[] = [
    taskPosition(row, condition),
    task?.scenario,
    task?.started_at,
    task?.ended_at,
    task?.duration_sec,
    task?.ended_at ? task.gave_up : null,
    task?.confidence,
    task?.answer,
    row[scoreColumn(condition)],
  ];
  return condition === "prototype" ? [...cells, task ? formatSearches(task.searches) : null] : cells;
}

export const CSV_HEADERS = [
  "participant",
  "session_id",
  "created_at",
  "updated_at",
  "finished_at",
  "state",
  "source",
  "is_grad",
  "days_on_campus",
  "carries_laptop",
  "eligible",
  "completed",
  "order",
  ...conditionHeaders("status_quo"),
  ...conditionHeaders("prototype"),
  "would_use",
  "blocker",
];

export function toCsv(rows: readonly SessionRow[]): string {
  const lines = rows.map((row, index) =>
    [
      `P${index + 1}`,
      row.id,
      row.created_at,
      row.updated_at,
      row.finished_at,
      SESSION_STATE_LABEL[sessionState(row)],
      row.source,
      row.is_grad,
      row.days_on_campus,
      row.carries_laptop,
      row.eligible,
      row.completed,
      row.task_order,
      ...conditionCells(row, "status_quo"),
      ...conditionCells(row, "prototype"),
      row.would_use,
      row.blocker,
    ]
      .map(csvCell)
      .join(","),
  );
  return [CSV_HEADERS.join(","), ...lines].join("\r\n") + "\r\n";
}
