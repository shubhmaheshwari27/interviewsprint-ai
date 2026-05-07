# InterviewSprint AI

> AI-powered job application and interview preparation platform.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748)](https://www.prisma.io/)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-black)](https://vercel.com/)

---

## Overview

**InterviewSprint AI** is a full-stack SaaS platform that helps job seekers track their job applications, manage interview stages, and leverage AI to prepare for interviews. Users paste a job description and receive AI-generated interview questions, skill gap analysis, and personalized preparation roadmaps.

---

## Architecture Summary

```
Next.js 16 App Router (SSR-first)
├── React Server Components (data fetching, layout)
├── Client Components (interactive UI, forms)
├── Server Actions (mutations: create/update/delete)
├── Route Handlers (AI endpoints, auth callbacks)
└── Middleware (protected route enforcement)

PostgreSQL + Prisma ORM
Auth.js v5 (Google OAuth + Credentials)
Gemini API / Groq API (AI features)
Vercel (deployment)
```

---

## Feature Summary

| Feature | Description |
|---|---|
| Authentication | Google OAuth + email/password login via Auth.js |
| Job Application CRUD | Create, edit, delete, view job applications |
| Interview Stage Tracking | Track rounds and outcomes per application |
| Dashboard Analytics | Status distribution charts, recent activity |
| AI Interview Prep | Generate questions, skill gaps, roadmap from JD |
| Search & Filter | Filter by status, search by company, sort by date |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 App Router |
| Language | TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | Auth.js v5 (NextAuth) |
| Validation | Zod + React Hook Form |
| Charts | Recharts |
| AI | Gemini API (gemini-1.5-flash) |
| Deployment | Vercel |

---

## Local Development Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 15+ (local or remote)
- Google OAuth credentials
- Gemini API key

### 1. Clone the repository

```bash
git clone https://github.com/your-username/interviewsprint-ai.git
cd interviewsprint-ai
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in all values (see Environment Variables section below).

### 4. Set up the database

```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/interviewsprint"

# Auth.js
AUTH_SECRET="your-auth-secret-min-32-chars"
AUTH_URL="http://localhost:3000"

# Google OAuth
AUTH_GOOGLE_ID="your-google-client-id"
AUTH_GOOGLE_SECRET="your-google-client-secret"

# AI
GEMINI_API_KEY="your-gemini-api-key"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## Deployment (Vercel)

1. Push repository to GitHub.
2. Import project in Vercel dashboard.
3. Add all environment variables in Vercel project settings.
4. Set `DATABASE_URL` to your production PostgreSQL connection string (e.g., Neon, Supabase, Railway).
5. Run `npx prisma migrate deploy` as a build command or post-deploy hook.
6. Vercel auto-deploys on every push to `main`.

Recommended `vercel.json`:

```json
{
  "buildCommand": "npx prisma generate && next build"
}
```

---

## Folder Structure (Top Level)

```
interviewsprint-ai/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Auth route group
│   ├── (dashboard)/        # Protected dashboard group
│   └── api/                # Route Handlers
├── components/             # Reusable UI components
├── lib/                    # Utilities, auth config, prisma client
├── prisma/                 # Schema, migrations
├── actions/                # Server Actions
├── hooks/                  # Custom client hooks
├── types/                  # TypeScript types
└── middleware.ts            # Route protection
```

---

## Screenshots

> _Add screenshots after first build sprint._

- `/screenshots/dashboard.png`
- `/screenshots/application-list.png`
- `/screenshots/ai-prep.png`
- `/screenshots/auth.png`

---

## Scalability Considerations

- All data fetching is server-side (RSC) — zero client waterfall for initial loads.
- AI endpoints are rate-limited per user per minute via in-memory token bucket.
- Prisma queries use indexed fields (`userId`, `status`, `createdAt`).
- Pagination is implemented at the database query level.
- Auth sessions use JWT strategy — stateless and horizontally scalable.

---

## Security Considerations

- All routes behind `/dashboard` require authenticated session via middleware.
- Server Actions validate session before any mutation.
- All user inputs validated with Zod before database writes.
- AI endpoints validate ownership before processing.
- Environment variables never exposed to client bundle.
- `.env.local` excluded from version control.

---

## Future Improvements

- Resume PDF upload and parsing
- Email reminders for upcoming interviews
- Team/recruiter collaboration mode
- Export applications to CSV
- LinkedIn job import integration

---

## License

MIT
