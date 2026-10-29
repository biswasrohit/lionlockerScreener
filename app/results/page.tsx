import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { LoginForm } from "@/components/results/LoginForm";
import { ResultsTable } from "@/components/results/ResultsTable";
import { SummaryTiles } from "@/components/results/SummaryTiles";
import styles from "@/components/results/results.module.css";
import { summarize } from "@/lib/results/stats";
import type { SessionRow } from "@/lib/results/types";
import { isResultsAuthed } from "@/lib/server/results-auth";
import { listSessions } from "@/lib/server/sessions-repo";
import { logout } from "./actions";

export const metadata: Metadata = {
  title: "Results | LionLocker concept test",
  robots: { index: false, follow: false },
};

export default function ResultsPage() {
  return (
    <div className="shell shell--wide">
      <SiteHeader tag="Team only" />
      <Suspense fallback={<p className="label">Loading results</p>}>
        <ResultsGate />
      </Suspense>
    </div>
  );
}

type Loaded = { readonly ok: true; readonly rows: SessionRow[] } | { readonly ok: false };

async function loadRows(): Promise<Loaded> {
  try {
    return { ok: true, rows: await listSessions() };
  } catch (error) {
    console.error("[results] load failed", error);
    return { ok: false };
  }
}

/**
 * Reads the cookie and the database at request time, inside the Suspense
 * boundary. A missing env var throws here and is shown by error.tsx.
 */
async function ResultsGate() {
  if (!(await isResultsAuthed())) return <LoginForm />;

  const loaded = await loadRows();
  if (!loaded.ok) {
    return (
      <p className="notice" role="alert">
        Couldn&apos;t load results from the database. Reload to try again.
      </p>
    );
  }
  return <ResultsView rows={loaded.rows} />;
}

function ResultsView({ rows }: { rows: readonly SessionRow[] }) {
  return (
    <main>
      <div className={styles.toolbar}>
        <h1>Results</h1>
        <div className={styles.toolbarActions}>
          <a className="btn btn-primary" href="/results/csv" download>
            Download CSV
          </a>
          <form action={logout}>
            <button type="submit" className="btn btn-secondary">
              Log out
            </button>
          </form>
        </div>
      </div>
      <SummaryTiles summary={summarize(rows)} />
      <ResultsTable rows={rows} />
    </main>
  );
}
