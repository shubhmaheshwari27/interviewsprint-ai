# TECH_ARCHITECTURE.md

## Purpose

Defines the complete technical architecture of InterviewSprint AI. This document explains every architectural decision, rendering strategy, component boundary, and data flow pattern. Coding agents must implement the system exactly as described here.

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   Browser (Client)                   │
│  React Client Components, Recharts, React Hook Form  │
└───────────────────────┬─────────────────────────────┘
                        │ HTTP / Server Actions
┌───────────────────────▼─────────────────────────────┐
│              Next.js 16 App Router Server             │
│                                                       │
│  ┌─────────────────┐  ┌──────────────────────────┐  │
│  │ React Server    │  │  Server Actions           │  │
│  │ Components      │  │  (mutations via forms)    │  │
│  │ (data fetching) │  └──────────────────────────┘  │
│  └─────────────────┘  ┌──────────────────────────┐  │
│                        │  Route Handlers           │  │
│  ┌─────────────────┐  │  /api/ai/analyze          │  │
│  │ Middleware       │  │  /api/auth/[...nextauth]  │  │
│  │ (route guard)   │  └──────────────────────────┘  │
│  └─────────────────┘                                 │
└───────────────────────┬─────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
┌───────▼──────┐ ┌──────▼──────┐ ┌────▼──────┐
│  PostgreSQL   │ │  Auth.js    │ │  Gemini   │
│  via Prisma   │ │  (JWT)      │ │  API      │
└──────────────┘ └─────────────┘ └───────────┘
```

---

## Rendering Strategy

### Server Components (RSC)

Used for all pages that need data from the database on initial load.

**Rules:**
- Fetch data directly using Prisma inside async Server Components.
- Never import Prisma in a client component.
- Never use `useState` or `useEffect` in server components.

**Examples:**
- `app/(dashboard)/dashboard/page.tsx` — fetches stats, recent apps.
- `app/(dashboard)/applications/page.tsx` — fetches application list with filters.
- `app/(dashboard)/applications/[id]/page.tsx` — fetches single application + rounds + AI analysis.

### Client Components

Used for interactive UI elements that require browser APIs, state, or event handlers.

**Marked explicitly with `"use client"` directive at top of file.**

**Examples:**
- `components/applications/ApplicationForm.tsx` — React Hook Form
- `components/dashboard/StatusChart.tsx` — Recharts
- `components/applications/AIAnalysisPanel.tsx` — click handler, loading state
- `components/ui/SearchFilterBar.tsx` — controlled inputs, URL param updates

### Server Actions

Used for all database mutations. Defined in `actions/` directory.

**Rules:**
- All Server Actions use `"use server"` directive.
- Always verify session via `auth()` at the top of every action.
- Always validate input with Zod before DB write.
- Return `{ success: true, data: T }` or `{ success: false, error: string }`.
- Never return raw Prisma errors to the client.

**Files:**
- `actions/applications.ts`
- `actions/interview-rounds.ts`

### Route Handlers

Used for endpoints that need request body parsing, external API calls, or rate limiting.

**Files:**
- `app/api/ai/analyze/route.ts` — AI analysis endpoint
- `app/api/auth/[...nextauth]/route.ts` — Auth.js handler

---

## Middleware

File: `middleware.ts` (root of project)

**Behavior:**
- Matches all routes under `/dashboard/**`.
- Checks for valid Auth.js session token.
- Redirects unauthenticated users to `/login`.
- Allows `/login`, `/register`, `/`, `/api/auth/**` without auth.

```typescript
// middleware.ts
export { auth as middleware } from "@/lib/auth"

export const config = {
  matcher: ["/dashboard/:path*"],
}
```

---

## Data Flow Patterns

### Read (Server-side)

```
Browser request → Next.js Server → RSC executes → Prisma query → PostgreSQL
→ Data passed as props to Client Components → Rendered HTML sent to browser
```

### Write (Server Action)

```
Client form submit → Server Action invoked → Session verified → Zod validation
→ Prisma mutation → Return { success, error } → Client updates UI
```

### AI Analysis

```
Client click → fetch POST /api/ai/analyze → Route Handler → Session verified
→ Rate limit check → Fetch application.jobDescription from DB
→ Gemini API call → Parse JSON response → Upsert AIAnalysis in DB
→ Return structured result → Client renders AI panel
```

---

## Technology Decisions

### Why Next.js App Router (not Pages Router)?

- SSR-first with zero config for server components.
- Server Actions eliminate need for separate API routes for CRUD.
- Route groups allow clean layout separation between auth and dashboard.

### Why Auth.js v5?

- Supports Google OAuth + Credentials in a single config.
- Prisma adapter manages User/Account/Session automatically.
- Middleware integration via exported `auth` function is clean and simple.

### Why Server Actions for CRUD (not Route Handlers)?

- Tighter integration with Next.js form handling.
- Automatic CSRF protection.
- No manual fetch() calls needed from client forms.
- Easier to use with `useFormState` / `useTransition`.

### Why Gemini API?

- Free tier with sufficient rate limits for demo.
- `gemini-1.5-flash` model is fast and cheap for structured JSON generation.
- SDK available via `@google/generative-ai` npm package.

### Why PostgreSQL + Prisma?

- Prisma provides type-safe DB access with zero-config migrations.
- PostgreSQL is required by the assignment spec.
- Works seamlessly on Vercel with Neon or Railway as hosted DB provider.

---

## Environment Variable Boundaries

| Variable | Server only | Client accessible |
|---|---|---|
| `DATABASE_URL` | ✅ | ❌ |
| `AUTH_SECRET` | ✅ | ❌ |
| `AUTH_GOOGLE_ID` | ✅ | ❌ |
| `AUTH_GOOGLE_SECRET` | ✅ | ❌ |
| `GEMINI_API_KEY` | ✅ | ❌ |
| `NEXT_PUBLIC_APP_URL` | ✅ | ✅ |

Variables without `NEXT_PUBLIC_` prefix are never included in the client bundle by Next.js.

---

## Package Dependencies

```json
{
  "dependencies": {
    "next": "16.x",
    "react": "19.x",
    "react-dom": "19.x",
    "typescript": "5.x",
    "@prisma/client": "^5.x",
    "next-auth": "^5.0.0-beta",
    "@auth/prisma-adapter": "^2.x",
    "bcryptjs": "^2.x",
    "zod": "^3.x",
    "react-hook-form": "^7.x",
    "@hookform/resolvers": "^3.x",
    "recharts": "^2.x",
    "@google/generative-ai": "^0.x",
    "tailwindcss": "^3.x",
    "clsx": "^2.x",
    "tailwind-merge": "^2.x",
    "lucide-react": "^0.x",
    "date-fns": "^3.x"
  },
  "devDependencies": {
    "prisma": "^5.x",
    "@types/bcryptjs": "^2.x",
    "@types/node": "^20.x",
    "@types/react": "^19.x"
  }
}
```

**shadcn/ui** components are installed individually via CLI (`npx shadcn-ui@latest add button`), not as a package. They live in `components/ui/`.

---

## Prisma Client Singleton

File: `lib/prisma.ts`

```typescript
import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
```

This prevents multiple Prisma Client instances during hot reload in development.
