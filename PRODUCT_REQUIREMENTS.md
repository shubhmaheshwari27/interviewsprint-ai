# PRODUCT_REQUIREMENTS.md

## Purpose

Defines every functional and non-functional requirement for **InterviewSprint AI**. This document is the single source of truth for feature scope and expected behavior. Coding agents must implement exactly what is described here — no more, no less.

---

## Functional Requirements

### FR-1: Authentication

| ID | Requirement |
|---|---|
| FR-1.1 | Users can register with email and password |
| FR-1.2 | Users can log in with email and password |
| FR-1.3 | Users can log in with Google OAuth |
| FR-1.4 | Sessions persist across browser refreshes |
| FR-1.5 | Unauthenticated users accessing `/dashboard/**` are redirected to `/login` |
| FR-1.6 | Users can log out from any dashboard page |
| FR-1.7 | Auth errors display user-friendly messages (invalid credentials, account exists) |

**Accepted email/password behavior:**
- Minimum password length: 8 characters
- Password stored as bcrypt hash (rounds: 10)
- Email uniqueness enforced at database level

---

### FR-2: Job Application Management

| ID | Requirement |
|---|---|
| FR-2.1 | Authenticated users can create a job application |
| FR-2.2 | Users can view a list of all their applications |
| FR-2.3 | Users can view the detail page of a single application |
| FR-2.4 | Users can edit any field of an application they own |
| FR-2.5 | Users can delete an application they own (with confirmation dialog) |
| FR-2.6 | Users can only access their own applications — never another user's |

**Application fields:**

| Field | Type | Required | Notes |
|---|---|---|---|
| `companyName` | string | Yes | Max 100 chars |
| `roleTitle` | string | Yes | Max 100 chars |
| `jobDescription` | string | No | Max 10,000 chars |
| `status` | enum | Yes | Default: `APPLIED` |
| `applicationDate` | date | Yes | Default: today |
| `techStack` | string | No | Comma-separated, max 500 chars |
| `notes` | string | No | Max 5,000 chars |
| `salaryRange` | string | No | e.g. "$120k–$150k", max 50 chars |
| `interviewStage` | string | No | Free text, e.g. "Round 2 - System Design" |

**Status values:** `APPLIED`, `SCREENING`, `INTERVIEWING`, `OFFER`, `REJECTED`, `WITHDRAWN`

---

### FR-3: Interview Rounds

| ID | Requirement |
|---|---|
| FR-3.1 | Users can add interview rounds to an application |
| FR-3.2 | Each round has: name, date, type, outcome, notes |
| FR-3.3 | Users can edit or delete individual rounds |
| FR-3.4 | Rounds are displayed chronologically on the application detail page |

**Interview Round fields:**

| Field | Type | Required |
|---|---|---|
| `name` | string | Yes (e.g. "Phone Screen") |
| `scheduledAt` | datetime | No |
| `type` | enum | Yes: `PHONE`, `TECHNICAL`, `SYSTEM_DESIGN`, `BEHAVIORAL`, `HR`, `ONSITE` |
| `outcome` | enum | No: `PASSED`, `FAILED`, `PENDING`, `CANCELLED` |
| `notes` | string | No |

---

### FR-4: Dashboard

| ID | Requirement |
|---|---|
| FR-4.1 | Dashboard displays total application count |
| FR-4.2 | Dashboard displays count of applications in each status |
| FR-4.3 | Dashboard displays a pie or bar chart of status distribution |
| FR-4.4 | Dashboard displays the 5 most recently updated applications |
| FR-4.5 | Dashboard data is fetched server-side (RSC, no client fetch on load) |
| FR-4.6 | Each summary card links to the filtered applications list |

---

### FR-5: Application List (Search & Filter)

| ID | Requirement |
|---|---|
| FR-5.1 | Users can filter applications by status using a dropdown |
| FR-5.2 | Users can search applications by company name (case-insensitive, partial match) |
| FR-5.3 | Users can sort by `applicationDate` ascending or descending |
| FR-5.4 | The list uses URL search params (`?status=APPLIED&q=google&sort=desc`) |
| FR-5.5 | Filters persist on page refresh via URL params |
| FR-5.6 | The list shows 10 applications per page with pagination controls |

---

### FR-6: AI Analysis

| ID | Requirement |
|---|---|
| FR-6.1 | User can trigger AI analysis from the application detail page |
| FR-6.2 | AI analysis requires a non-empty `jobDescription` field |
| FR-6.3 | If `jobDescription` is empty, show error: "Please add a job description first." |
| FR-6.4 | AI returns: interview questions, skill gaps, resume tips, preparation roadmap |
| FR-6.5 | AI results are stored in the database under `AIAnalysis` linked to the application |
| FR-6.6 | Re-triggering AI analysis overwrites the previous result for that application |
| FR-6.7 | AI endpoint enforces rate limiting: max 5 requests per user per 60 seconds |
| FR-6.8 | AI loading state is shown during analysis (spinner + "Analyzing…" text) |
| FR-6.9 | AI errors (API failure, timeout) show a user-friendly error message |

---

## Non-Functional Requirements

### NFR-1: Performance

| ID | Requirement |
|---|---|
| NFR-1.1 | Dashboard initial load uses SSR — no client-side data fetching on first render |
| NFR-1.2 | Application list uses SSR with URL param-driven filtering |
| NFR-1.3 | Images use `next/image` with appropriate sizes |
| NFR-1.4 | Route-level loading states via `loading.tsx` files in App Router |
| NFR-1.5 | AI analysis call shows optimistic UI while awaiting response |

### NFR-2: Security

| ID | Requirement |
|---|---|
| NFR-2.1 | All Server Actions verify session before executing mutations |
| NFR-2.2 | All Route Handlers verify session before processing |
| NFR-2.3 | Database queries always filter by `userId` to prevent unauthorized access |
| NFR-2.4 | Zod validates all incoming data before DB writes |
| NFR-2.5 | `AUTH_SECRET` is minimum 32 characters, never committed to source control |
| NFR-2.6 | `GEMINI_API_KEY` is server-only and never exposed to client bundle |
| NFR-2.7 | CSRF protection is handled by Auth.js for credential login |

### NFR-3: Accessibility

| ID | Requirement |
|---|---|
| NFR-3.1 | All form inputs have associated `<label>` elements |
| NFR-3.2 | Color is never the sole indicator of status (include text label) |
| NFR-3.3 | Modals/dialogs trap focus correctly |
| NFR-3.4 | Interactive elements are keyboard navigable |
| NFR-3.5 | ARIA attributes applied where shadcn/ui doesn't handle them automatically |

### NFR-4: Responsiveness

| ID | Requirement |
|---|---|
| NFR-4.1 | UI is fully usable on screens 375px and wider |
| NFR-4.2 | Dashboard layout switches to single-column on mobile |
| NFR-4.3 | Navigation collapses to a drawer/menu on mobile |
| NFR-4.4 | Tables in application list become card-style on mobile |

### NFR-5: Error Handling

| ID | Requirement |
|---|---|
| NFR-5.1 | Global `error.tsx` boundary catches unexpected rendering errors |
| NFR-5.2 | Server Actions return typed `{ success, error }` objects — never throw to client |
| NFR-5.3 | 404 pages use `not-found.tsx` |
| NFR-5.4 | AI errors are handled gracefully without crashing the page |
