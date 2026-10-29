import { SCENARIOS, type ScenarioId } from "@/lib/study";

export function ScenarioCard({ scenario }: { readonly scenario: ScenarioId }) {
  const { title, prompt } = SCENARIOS[scenario];
  return (
    <section className="scenario" aria-label="Scenario">
      <span className="label">Scenario</span>
      <h2>{title}</h2>
      <p>{prompt}</p>
    </section>
  );
}
