"use client";

export default function ResultsError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="shell shell--wide">
      <div className="notice" role="alert" style={{ marginTop: 24 }}>
        <p>
          Couldn&apos;t load results. Check that SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and
          RESULTS_PASSWORD are set, then try again.
        </p>
        <button type="button" className="btn btn-secondary" style={{ marginTop: 10 }} onClick={reset}>
          Try again
        </button>
      </div>
    </div>
  );
}
