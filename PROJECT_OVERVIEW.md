# PROJECT_OVERVIEW.md

## Purpose

This document gives coding agents and developers a complete understanding of what **InterviewSprint AI** is, what problem it solves, what it is intentionally NOT, and the exact scope of work to be built within 4 days by a single developer.

---

## What Is InterviewSprint AI?

InterviewSprint AI is a personal job search command center. It combines structured job application tracking with AI-powered interview preparation — all in one dashboard.

**Core user journey:**

1. User signs up via Google OAuth or email/password.
2. User creates a job application by entering company, role, job description, status, and notes.
3. User tracks applications across statuses: `APPLIED`, `SCREENING`, `INTERVIEWING`, `OFFER`, `REJECTED`, `WITHDRAWN`.
4. User opens any application and triggers AI analysis on the job description.
5. AI returns: interview questions, skill gap list, resume improvement tips, and a preparation roadmap.
6. User reviews dashboard analytics for an overview of their job search pipeline.

---

## Target User

A software engineer (or any professional) actively job hunting who wants to:

- Stay organized across multiple applications
- Prepare effectively for technical and behavioral interviews
- Understand what skills they need to develop for specific roles

---

## Product Scope (4-Day Build)

### In Scope

| Feature | Notes |
|---|---|
| User authentication | Google OAuth + email/password, session persistence |
| Job application CRUD | Full create/edit/delete with all fields |
| Application status tracking | 6 status states with UI labels and colors |
| Interview stage management | Add named rounds to each application |
| Dashboard with analytics | Status breakdown charts, summary cards |
| AI job description analysis | Questions, skill gaps, resume tips, roadmap |
| Search and filter | By status, company name, date sort |
| Responsive design | Mobile-first, works on all screen sizes |

### Explicitly Out of Scope

| Feature | Reason |
|---|---|
| Resume PDF upload/parsing | Adds complexity beyond 4-day scope |
| Email notifications | Requires external email service integration |
| Multi-user teams | Not needed for personal use demo |
| LinkedIn/job board import | Third-party API dependencies outside scope |
| Calendar/reminder system | Out of scope for MVP |
| Real-time collaboration | Unnecessary for single-user context |

---

## Application Status State Machine

```
APPLIED → SCREENING → INTERVIEWING → OFFER
                  ↘              ↘
                REJECTED       WITHDRAWN
```

Any application can transition to `REJECTED` or `WITHDRAWN` from any status.

Valid `ApplicationStatus` enum values:
- `APPLIED`
- `SCREENING`
- `INTERVIEWING`
- `OFFER`
- `REJECTED`
- `WITHDRAWN`

---

## AI Feature Scope

AI analysis is triggered per job application by the user explicitly clicking "Analyze with AI."

**Input:** The stored `jobDescription` field of the application.

**Output (structured JSON from Gemini):**

```json
{
  "interviewQuestions": [
    { "category": "Technical", "question": "Explain the difference between..." },
    { "category": "Behavioral", "question": "Tell me about a time..." }
  ],
  "skillGaps": [
    { "skill": "Kubernetes", "importance": "High", "reason": "..." }
  ],
  "resumeTips": [
    "Quantify your impact on previous projects..."
  ],
  "preparationRoadmap": [
    { "week": 1, "focus": "System Design basics", "resources": ["..."] }
  ]
}
```

AI results are stored in the database on the `AIAnalysis` model linked to the application.

---

## Key User Flows

### Flow 1: New Application

1. Click "New Application" button on dashboard.
2. Fill in: company, role, job description, status, application date, tech stack (comma-separated), notes, salary range.
3. Submit → Server Action validates → inserts to DB → redirect to application detail.

### Flow 2: Edit Application

1. Open application detail page.
2. Click "Edit."
3. Modify fields in form.
4. Submit → Server Action → upsert → refresh page.

### Flow 3: AI Analysis

1. Open application with job description filled.
2. Click "Analyze with AI."
3. Loading state shown.
4. POST to `/api/ai/analyze` with `applicationId`.
5. Server fetches job description, sends to Gemini, parses response.
6. Result stored in `AIAnalysis` table.
7. UI renders structured results below.

### Flow 4: Dashboard View

1. User lands on `/dashboard`.
2. Server Component fetches: total applications, status breakdown, recent 5 applications.
3. Charts rendered on client (Recharts).
4. No loading waterfall — all data pre-fetched server-side.

---

## Developer Notes

- The project uses **Next.js App Router exclusively**. No Pages Router.
- All data mutations go through **Server Actions** (no separate REST endpoints for CRUD).
- AI endpoints use **Route Handlers** (`/api/ai/analyze`) because they need request body parsing and rate limiting.
- The database has **5 core tables**: `User`, `Account`, `Session`, `Application`, `AIAnalysis`, `InterviewRound`.
- Auth.js manages `User`, `Account`, `Session` tables automatically via Prisma adapter.
