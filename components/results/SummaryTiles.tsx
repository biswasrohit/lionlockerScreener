import { formatDuration, type Summary } from "@/lib/results/stats";
import styles from "./results.module.css";

function Tile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className={styles.tile}>
      <span className="label">{label}</span>
      <span className={styles.tileValue}>{value}</span>
      {note ? <span className={styles.tileNote}>{note}</span> : null}
    </div>
  );
}

const orDash = (value: string) => (value === "" ? "n/a" : value);
const conf = (value: number | null) => (value === null ? "n/a" : String(value));

export function SummaryTiles({ summary }: { readonly summary: Summary }) {
  const sq = summary.byCondition.status_quo;
  const proto = summary.byCondition.prototype;

  return (
    <div className={styles.tiles}>
      <Tile label="Started" value={String(summary.started)} />
      <Tile label="Eligible" value={String(summary.eligible)} />
      <Tile label="Completed" value={String(summary.completed)} />
      <Tile
        label="Median time, status quo"
        value={orDash(formatDuration(sq.medianTimeSec))}
        note={`${sq.timedCount} timed, ${sq.gaveUpCount} gave up`}
      />
      <Tile
        label="Median time, prototype"
        value={orDash(formatDuration(proto.medianTimeSec))}
        note={`${proto.timedCount} timed, ${proto.gaveUpCount} gave up`}
      />
      <Tile
        label="Median confidence, status quo"
        value={conf(sq.medianConfidence)}
        note={`of 5, n=${sq.ratedCount}`}
      />
      <Tile
        label="Median confidence, prototype"
        value={conf(proto.medianConfidence)}
        note={`of 5, n=${proto.ratedCount}`}
      />
      <Tile
        label="Would use: yes"
        value={`${summary.wouldUseYes} / ${summary.completed}`}
        note="of completed"
      />
    </div>
  );
}
