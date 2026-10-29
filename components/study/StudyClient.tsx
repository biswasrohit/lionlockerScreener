"use client";

import dynamic from "next/dynamic";

// The flow reads sessionStorage on first render to resume a session, so it
// only renders in the browser. This avoids a server and client mismatch.
const StudyFlow = dynamic(() => import("./StudyFlow"), {
  ssr: false,
  loading: () => (
    <div className="sheet" aria-busy="true">
      <p className="label">Loading</p>
    </div>
  ),
});

export function StudyClient() {
  return <StudyFlow />;
}
