# InterviewSprint AI

**Run your job search like a data project.** Track every application, see which channels actually reply,
learn which skills the market asks for, and prepare for each interview with AI.

**Live demo:** https://interviewsprint-ai.vercel.app (click **Try the live demo**, no sign-up needed)

The demo account holds real, anonymised data from my own job search in November 2026. I ran it with an
automated daily routine that applied through Indian job portals and emailed recruiters, and logged every job it
screened. Recruiter names, emails, phone numbers and notes are removed; company and role names are kept.

## What the data showed

| | |
|---|---|
| Applications tracked | **194** over 8 active days (Naukri, Instahyre, Wellfound, LinkedIn, Cutshort, Indeed, direct email) |
| Jobs screened for the market analysis | **524**, each with the skills and experience it required |
| Best channel | **Emailing recruiters directly: 14.3% response rate**, against under 5% on every job portal |
| Most demanded skills | React (in 48% of screened jobs), Node.js (36%), SQL (22%), TypeScript (19%) |
| Skills to learn next | **Python** was the only skill I was missing in 29 of the screened jobs, followed by **Spring Boot** (19) |

Those findings changed how I searched: more direct emails and referrals, fewer portal applications, and a
Spring Boot service in this project to close the second-biggest gap.

## Screenshots

| Job-hunt analytics | Market gap |
|---|---|
| ![Analytics](docs/screenshots/analytics.jpg) | ![Market gap](docs/screenshots/market.jpg) |

![AI interview prep with the offline fallback](docs/screenshots/ai-prep.jpg)

## Features

- **Applications & interview rounds** – full CRUD with status tracking, filters and interview-round timeline.
- **Job-hunt analytics** – applications per day, funnel (applied → responded → interview → offer),
  applications and response rate by portal.
- **Market gap** – which skills the screened jobs ask for (highlighting the ones you have), why jobs were
  skipped, experience asked for, and the missing skills that would unlock the most jobs.
- **AI interview prep** – per job description: likely questions, skill gaps, resume tips and a prep roadmap.
- **CSV import** – bring in applications and screened jobs from any tracker; re-imports are idempotent.
- **Read-only demo account** – every write action is blocked for it on the server.

## Built to degrade gracefully

Two parts of the system are optional, and neither can take the app down:

- **AI provider (OpenAI).** The client is created lazily (a missing key no longer crashes at import), calls have
  a 20 s timeout and one retry, and the response is validated with Zod. If the AI is unconfigured, slow, failing or
  returns unusable JSON, the app generates an **offline analysis** from the job description and the user's skills,
  and labels it as such. After a failure, a 60-second circuit breaker skips the AI so users don't each wait for
  another timeout.
- **Java analytics service.** When `ANALYTICS_SERVICE_URL` is set, the Analytics and Market Gap pages ask the
  Spring Boot service for their summaries with a 2-second timeout and validate the reply. On any failure the same
  summary is computed in the app. The page shows which engine answered.

## Architecture

```mermaid
flowchart LR
  B[Browser] --> N["Next.js 16 app<br/>Server Components + Server Actions"]
  N --> DB[(PostgreSQL<br/>Prisma)]
  N -. optional, 2 s timeout .-> J["analytics-service<br/>Spring Boot 3 / Java 17"]
  N -. optional, 20 s timeout .-> O[OpenAI API]
  J -. on failure .-> F1[built-in TS analytics]
  O -. on failure .-> F2[offline rule-based analysis]
  T["Daily job-hunt automation<br/>(tracker CSV)"] -- CSV import / demo seed --> N
```

## Tech stack

| Layer | Technology |
|---|---|
| Web app | Next.js 16 (App Router, Server Components, Server Actions), React 19, TypeScript |
| UI | Tailwind CSS v4, shadcn/ui, Recharts |
| Data | PostgreSQL, Prisma ORM (migrations applied on deploy) |
| Auth | Auth.js v5: Google OAuth and email/password |
| AI | OpenAI API with Zod validation and an offline fallback |
| Analytics service | Java 17, Spring Boot 3, Bean Validation, Actuator, JUnit 5, Docker |
| Quality | Vitest (web), JUnit + MockMvc (service), GitHub Actions CI |
| Hosting | Vercel |

## Project structure

```
app/                 Next.js routes: landing, auth, dashboard (applications, analytics, market, prep, settings)
actions/             Server actions: applications, interview rounds, AI analysis, CSV import, skills
components/          UI and feature components (analytics charts, settings forms, ...)
lib/                 analytics.ts, market.ts, skills.ts, csv.ts, import.ts, ai/analysis.ts, analytics-client.ts
prisma/              schema, migrations, demo seed (seed-demo.ts + demo/*.json)
analytics-service/   Spring Boot service (see its README)
tests/               Vitest unit tests
scripts/migrate.mjs  build-time migration runner
```

## Run locally

```bash
npm install
cp .env.example .env.local      # fill in DATABASE_URL and AUTH_SECRET at least
npx prisma migrate deploy
npm run seed:demo               # optional: loads the demo account
npm run dev
```

`OPENAI_API_KEY` and `ANALYTICS_SERVICE_URL` are optional; without them the app uses its offline analysis and
built-in analytics. To run the Java service, see [analytics-service/README.md](analytics-service/README.md).

## Tests

```bash
npm test                        # Vitest: analytics, market gap, CSV import, AI fallback
npm run typecheck
cd analytics-service && mvn verify   # JUnit + MockMvc
```

CI runs all of these on every push.

---

Built by **Shubh Maheshwari** · [LinkedIn](https://www.linkedin.com/in/shubh-maheshwari/) · [Portfolio](https://shubhmaheshwari.vercel.app/)
