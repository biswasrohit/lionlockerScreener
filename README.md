# LionLocker concept test

A mobile-first smoke-and-mirrors study site for the COMS W4170 LionLocker team project. Participants compare finding campus storage the way they normally would (status quo) against a hand-prepared LionLocker prototype. The team reads results at `/results`.

There is no real lookup backend. Every prototype answer comes from [lib/storage.ts](lib/storage.ts), written by hand from official Columbia pages.

## How it works

- **Participant flow** (`/`): consent, screener, two counterbalanced tasks (condition order and scenario pairing are each randomized per participant), a 1-5 confidence rating after each answered task, final questions, debrief.
- **Saving**: the browser posts the full session snapshot to `POST /api/session` after the screener, after each answer and rating, and at the end. The server validates it with zod, recomputes eligibility, and upserts by a random session id using the Supabase service role key. Saves are queued in order and retried. Progress is also kept in `sessionStorage`, so a phone that reloads the tab mid-task resumes on the same step with the timer intact.
- **Database**: one `sessions` table with RLS on and no policies, so the public anon key can do nothing. No names, emails, phone numbers, IPs or user agents are stored.
- **Results** (`/results`): one shared password from `RESULTS_PASSWORD`, checked server side. A signed, expiring httpOnly cookie keeps the team logged in for 7 days. Shows summary tiles, a per-session table, correct / partly / wrong scoring per task, and a CSV download (`/results/csv`).

Two judgment calls worth knowing about:

- If a participant taps "I couldn't find an answer", the confidence question is skipped for that task (there's no answer to rate), and its confidence is stored as empty.
- "I couldn't find an answer" asks for a quick confirmation so a mis-tap doesn't end the task.

## Editing content

| What | Where |
| --- | --- |
| Prototype result cards (steps, tags, sources) | [lib/storage.ts](lib/storage.ts) |
| Scenarios, condition instructions, screener options | [lib/study.ts](lib/study.ts) |
| Screen copy | [components/study/screens/](components/study/screens/) |
| Colors and fonts | [app/globals.css](app/globals.css), [app/layout.tsx](app/layout.tsx) |

Copy rule: no em dashes anywhere in UI copy or code comments. A unit test checks the storage cards.

## Deploy (about 15 minutes)

### 1. Create the Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and click **New project**. Pick a region near New York (East US). Save the database password somewhere, though the app doesn't need it.
2. When the project is ready, open **SQL Editor**, click **New query**, paste the whole of [supabase/migrations/20261029000000_create_sessions.sql](supabase/migrations/20261029000000_create_sessions.sql), and click **Run**. It should say "Success. No rows returned".
3. Open **Table Editor** and confirm a `sessions` table exists and shows **RLS enabled**.
4. Collect two values:
   - **Project URL**: shown in the **Connect** dialog or **Project Settings > Data API**. It looks like `https://abcd1234.supabase.co`.
   - **Secret key**: **Project Settings > API Keys**. Use a secret key (`sb_secret_...`). On older projects, the legacy `service_role` key works too. Never use the publishable or anon key here, and never share the secret key.

### 2. Deploy on Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import the GitHub repo `biswasrohit/lionlockerScreener`. Vercel detects Next.js; keep the default build settings.
2. Before clicking Deploy, open **Environment Variables** and add these three (apply to Production and Preview):

   | Name | Value |
   | --- | --- |
   | `SUPABASE_URL` | the Project URL from step 1.4 |
   | `SUPABASE_SERVICE_ROLE_KEY` | the secret key from step 1.4 |
   | `RESULTS_PASSWORD` | a long shared team password |

   None of them start with `NEXT_PUBLIC_`, so none are sent to browsers.
3. Click **Deploy**. When it finishes, Vercel gives you a URL like `https://lionlocker-screener.vercel.app`.

If you change an environment variable later, redeploy (**Deployments > ... > Redeploy**) for it to take effect.

### 3. Smoke test before sharing the link

1. Open the site on your phone and go through once as an ineligible participant (answer "No" to the grad question).
2. Go through once as an eligible participant, including a prototype search.
3. Open `/results`, log in with `RESULTS_PASSWORD`, and check both rows appear. Try the scoring toggle and **Download CSV**.
4. Clear your test rows before real participants start. In the Supabase SQL Editor:

   ```sql
   delete from public.sessions;
   ```

Note: Supabase pauses free projects after a week without activity. If the study runs longer with quiet stretches, check the dashboard before each session.

## Local development

Requires Node 20+ and Docker (for a local Supabase).

```bash
npm install
npx supabase start          # starts local Postgres + API and applies the migration
cp .env.example .env.local  # then fill in values printed by `npx supabase status`
npm run dev                 # http://localhost:3000
```

For local Supabase, `SUPABASE_URL` is `http://127.0.0.1:54321` and `SUPABASE_SERVICE_ROLE_KEY` is the `SECRET_KEY` from `npx supabase status`.

### Checks

```bash
npm test           # unit tests (vitest)
npm run lint       # eslint
npm run typecheck  # tsc
npm run build      # production build
npm run e2e        # Playwright walkthrough on a phone viewport (needs local Supabase running and Google Chrome installed)
```

---

A student class project (COMS W4170 User Interface Design). Not an official Columbia service.
