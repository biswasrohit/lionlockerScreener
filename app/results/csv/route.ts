import { toCsv } from "@/lib/results/csv";
import { isResultsAuthed } from "@/lib/server/results-auth";
import { listSessions } from "@/lib/server/sessions-repo";

export async function GET() {
  if (!(await isResultsAuthed())) {
    return new Response("Not signed in.", { status: 401 });
  }
  try {
    const csv = toCsv(await listSessions());
    const date = new Date().toISOString().slice(0, 10);
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="lionlocker-results-${date}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[results/csv] export failed", error);
    return new Response("Could not build the CSV right now.", { status: 500 });
  }
}
