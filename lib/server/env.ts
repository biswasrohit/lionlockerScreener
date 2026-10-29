import "server-only";

type EnvName = "SUPABASE_URL" | "SUPABASE_SERVICE_ROLE_KEY" | "RESULTS_PASSWORD";

/** Reads a required server env var, failing loudly with the name if it's missing. */
export function requireEnv(name: EnvName): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`Missing required environment variable ${name}. See .env.example.`);
  }
  return value;
}
