# IMPLEMENTATION_ROADMAP.md

## Purpose

Defines the exact 4-day implementation plan for InterviewSprint AI. Tasks are ordered by dependency — later tasks depend on earlier ones being complete. This roadmap is designed for a single developer working approximately 8 hours per day.

---

## Day 1: Foundation (Project Setup + Auth + Database)

**Goal:** Working authentication flow with a running database.

### Morning (4 hours)

**Task 1.1 — Project initialization**
```bash
npx create-next-app@latest interviewsprint-ai --typescript --tailwind --app --src-dir no --import-alias "@/*"
cd interviewsprint-ai
```

**Task 1.2 — Install all dependencies**
```bash
npm install next-auth@beta @auth/prisma-adapter @prisma/client bcryptjs zod react-hook-form @hookform/resolvers recharts @google/generative-ai date-fns clsx tailwind-merge lucide-react

npm install --save-dev prisma @types/bcryptjs
```

**Task 1.3 — Initialize Prisma**
```bash
npx prisma init
```

**Task 1.4 — Write `prisma/schema.prisma`** (copy from `DATABASE_SCHEMA.md`)

**Task 1.5 — Set up local PostgreSQL and `.env.local`**

**Task 1.6 — Run initial migration**
```bash
npx prisma migrate dev --name init
npx prisma generate
```

**Task 1.7 — Create `lib/prisma.ts`** (Prisma singleton)

**Task 1.8 — Install shadcn/ui**
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input label select textarea dialog badge accordion alert skeleton separator dropdown-menu avatar
```

### Afternoon (4 hours)

**Task 1.9 — Create `lib/auth.ts`** (Auth.js config with Google + Credentials)

**Task 1.10 — Create `app/api/auth/[...nextauth]/route.ts`**

**Task 1.11 — Create `types/next-auth.d.ts`** (session type augmentation)

**Task 1.12 — Create `middleware.ts`** (route protection)

**Task 1.13 — Create `actions/auth.ts`** (`registerUser` Server Action)

**Task 1.14 — Create `app/(auth)/layout.tsx`** (centered card layout)

**Task 1.15 — Create `app/(auth)/login/page.tsx`** and `components/auth/LoginForm.tsx`

**Task 1.16 — Create `app/(auth)/register/page.tsx`** and `components/auth/RegisterForm.tsx`

**Task 1.17 — Create root `app/layout.tsx`** (SessionProvider, Inter font)

**Task 1.18 — Create landing `app/page.tsx`** (simple hero, login/register links)

**Day 1 Checkpoint:** User can register, log in with credentials, log in with Google, and be redirected to `/dashboard` (which can be a placeholder page). Unauthenticated access to `/dashboard` redirects to `/login`.

---

## Day 2: Core CRUD — Applications

**Goal:** Full job application CRUD working end-to-end.

### Morning (4 hours)

**Task 2.1 — Create `lib/utils.ts`** (cn, formatDate, statusConfig, PAGE_SIZE)

**Task 2.2 — Create `types/index.ts`** (ApplicationWithRelations, ActionResult)

**Task 2.3 — Create `actions/applications.ts`** (createApplication, updateApplication, deleteApplication)

**Task 2.4 — Create `app/(dashboard)/layout.tsx`** (sidebar + topnav layout)

**Task 2.5 — Create `components/layout/Sidebar.tsx`**

**Task 2.6 — Create `components/layout/TopNav.tsx`**

**Task 2.7 — Create `components/layout/MobileNav.tsx`**

### Afternoon (4 hours)

**Task 2.8 — Create `components/applications/ApplicationForm.tsx`** (create/edit with RHF + Zod)

**Task 2.9 — Create `app/(dashboard)/dashboard/applications/new/page.tsx`**

**Task 2.10 — Create `components/applications/ApplicationStatusBadge.tsx`**

**Task 2.11 — Create `components/applications/ApplicationCard.tsx`**

**Task 2.12 — Create `components/applications/SearchFilterBar.tsx`**

**Task 2.13 — Create `components/applications/Pagination.tsx`**

**Task 2.14 — Create `app/(dashboard)/dashboard/applications/page.tsx`** (list with filter/search)

**Task 2.15 — Create `app/(dashboard)/dashboard/applications/[id]/page.tsx`** (detail view)

**Task 2.16 — Create `app/(dashboard)/dashboard/applications/[id]/edit/page.tsx`**

**Task 2.17 — Create `components/applications/DeleteApplicationButton.tsx`**

**Task 2.18 — Add `not-found.tsx` and `error.tsx` for applications routes**

**Day 2 Checkpoint:** User can create, view, edit, delete, search, and filter job applications. All CRUD operations work. Navigation works. Forms validate correctly.

---

## Day 3: Dashboard + Interview Rounds + AI

**Goal:** Dashboard analytics, interview round tracking, and AI analysis working.

### Morning (4 hours)

**Task 3.1 — Create `components/dashboard/StatsCards.tsx`**

**Task 3.2 — Create `components/dashboard/StatusChart.tsx`** (Recharts PieChart)

**Task 3.3 — Create `components/dashboard/RecentApplications.tsx`**

**Task 3.4 — Create `app/(dashboard)/dashboard/page.tsx`** (fully populated dashboard)

**Task 3.5 — Add loading skeletons** (`loading.tsx` for dashboard and applications pages)

**Task 3.6 — Create `actions/interview-rounds.ts`** (CRUD for rounds)

**Task 3.7 — Create `components/interview-rounds/InterviewRoundForm.tsx`**

**Task 3.8 — Create `components/interview-rounds/InterviewRoundList.tsx`**

**Task 3.9 — Create `components/interview-rounds/DeleteRoundButton.tsx`**

### Afternoon (4 hours)

**Task 3.10 — Create `lib/gemini.ts`** (Gemini client setup)

**Task 3.11 — Create `lib/ai-prompt.ts`** (prompt builder)

**Task 3.12 — Create `lib/ai-validation.ts`** (Zod schema for AI response)

**Task 3.13 — Create `lib/rate-limiter.ts`**

**Task 3.14 — Create `app/api/ai/analyze/route.ts`** (full AI route handler)

**Task 3.15 — Create `components/applications/AIAnalysisPanel.tsx`** (trigger + results display)

**Task 3.16 — Integrate AIAnalysisPanel into application detail page**

**Task 3.17 — Test AI analysis end-to-end** (with real job description)

**Day 3 Checkpoint:** Dashboard shows real data with charts. Interview rounds can be added/edited/deleted. AI analysis works and stores results.

---

## Day 4: Polish, Tests, and Deployment

**Goal:** Production-ready polish, basic tests written, deployed to Vercel.

### Morning (4 hours)

**Task 4.1 — Responsive design audit** — test on 375px mobile viewport, fix layout issues

**Task 4.2 — Add optimistic delete** (useOptimisticApplications hook)

**Task 4.3 — Add `hooks/useDebounce.ts`** and integrate into SearchFilterBar

**Task 4.4 — Add `hooks/useOptimisticApplications.ts`**

**Task 4.5 — Review all forms for accessibility** (labels, aria-invalid, focus management)

**Task 4.6 — Create `.env.example`**

**Task 4.7 — Write tests** (priority: schema validation, AI validation, StatusBadge)

**Task 4.8 — Add `next.config.ts`** with security headers and image remotePatterns

**Task 4.9 — Create `vercel.json`**

### Afternoon (4 hours)

**Task 4.10 — Set up Neon database** and get production connection string

**Task 4.11 — Create GitHub repository** and push code

**Task 4.12 — Create Vercel project**, configure environment variables

**Task 4.13 — Run `prisma migrate deploy`** against production database

**Task 4.14 — Add production redirect URI** to Google Cloud Console

**Task 4.15 — Deploy and run post-deployment checklist** (from `DEPLOYMENT_GUIDE.md`)

**Task 4.16 — Fix any deployment issues**

**Task 4.17 — Polish landing page** (add tagline, features list, screenshots if ready)

**Task 4.18 — Final README review** — update with production URL, screenshots

**Day 4 Checkpoint:** App is live on Vercel. All features working in production. Tests pass. README is complete.

---

## Task Dependencies

```
Database Schema
    ↓
Prisma Client + Auth.js
    ↓
Server Actions (CRUD)
    ↓
Page Components (list, detail, form)
    ↓
Dashboard (needs application data)
    ↓
AI Feature (needs application detail page)
    ↓
Tests + Deployment
```

---

## Risk Mitigation

| Risk | Mitigation |
|---|---|
| Auth.js v5 beta breaking changes | Pin to specific beta version in package.json |
| Gemini API rate limits | Rate limiter implemented; use flash model (fastest) |
| Neon connection limits | Use connection pooling URL if hitting limits |
| Day 4 deployment issues | Start Vercel setup end of Day 3 |
