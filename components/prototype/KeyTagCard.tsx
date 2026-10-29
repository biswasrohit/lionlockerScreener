import type { StorageCard } from "@/lib/storage";
import styles from "./prototype.module.css";

export function KeyTagCard({ card }: { readonly card: StorageCard }) {
  return (
    <article className={styles.tag}>
      <span className={styles.hole} aria-hidden="true" />
      <div className={styles.tagBody}>
        <h3 className={styles.tagTitle}>{card.title}</h3>
        <ul className={styles.chips} aria-label="Details">
          {card.tags.map((tag) => (
            <li
              key={tag.label}
              className={tag.tone === "warning" ? `${styles.chip} ${styles.chipWarn}` : styles.chip}
            >
              {tag.label}
            </li>
          ))}
        </ul>
        <ol className={styles.steps}>
          {card.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p className={styles.sources}>
          <span className={styles.sourcesLabel}>Source</span>
          {card.sources.map((source) => (
            <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer">
              {source.label}
              <span className="visually-hidden"> (opens in a new tab)</span>
            </a>
          ))}
        </p>
      </div>
    </article>
  );
}

interface MessageTagProps {
  readonly title: string;
  readonly body: string;
}

export function MessageTag({ title, body }: MessageTagProps) {
  return (
    <article className={`${styles.tag} ${styles.tagMuted}`}>
      <span className={styles.hole} aria-hidden="true" />
      <div className={styles.tagBody}>
        <h3 className={styles.tagTitle}>{title}</h3>
        <p className={styles.message}>{body}</p>
      </div>
    </article>
  );
}
