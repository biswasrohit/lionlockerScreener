import { defineConfig, devices } from "@playwright/test";

// E2E runs against a production build and a local Supabase (npx supabase start).
// Supabase settings come from .env.local; the results password is fixed here.
const PORT = 3100;
export const E2E_RESULTS_PASSWORD = "e2e-team-password";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "phone",
      use: { ...devices["Pixel 7"], channel: "chrome" },
    },
  ],
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 180_000,
    env: { RESULTS_PASSWORD: E2E_RESULTS_PASSWORD },
  },
});
