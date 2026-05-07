# API_SPECIFICATION.md

## Purpose

Defines all API surface in InterviewSprint AI. This includes Route Handlers (REST-style endpoints) and Server Actions (form-based mutations). Coding agents must implement exactly these contracts.

---

## API Overview

| Category | Method | Route / Action | Description |
|---|---|---|---|
| Auth | GET/POST | `/api/auth/[...nextauth]` | Auth.js handler |
| AI | POST | `/api/ai/analyze` | Generate AI analysis for a job application |
| CRUD | Server Action | `createApplication` | Create a job application |
| CRUD | Server Action | `updateApplication` | Update a job application |
| CRUD | Server Action | `deleteApplication` | Delete a job application |
| Rounds | Server Action | `createInterviewRound` | Add interview round |
| Rounds | Server Action | `updateInterviewRound` | Update interview round |
| Rounds | Server Action | `deleteInterviewRound` | Delete interview round |

---

## Route Handlers

### POST `/api/ai/analyze`

**File:** `app/api/ai/analyze/route.ts`

**Authentication:** Required. Returns 401 if no session.

**Rate Limit:** 5 requests per user per 60 seconds.

**Request Body:**

```json
{
  "applicationId": "clxyz123abc"
}
```

**Validation:**

```typescript
const schema = z.object({
  applicationId: z.string().min(1),
})
```

**Behavior:**

1. Authenticate session via `auth()`.
2. Validate request body with Zod.
3. Check rate limit for `session.user.id`.
4. Fetch `Application` where `id = applicationId AND userId = session.user.id`.
5. If not found: return 404.
6. If `jobDescription` is null or empty: return 400.
7. Call Gemini API with the prompt (see `AI_FEATURES.md`).
8. Parse and validate Gemini response JSON.
9. Upsert `AIAnalysis` record.
10. Return structured analysis.

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "interviewQuestions": [
      { "category": "Technical", "question": "How does React reconciliation work?" },
      { "category": "Behavioral", "question": "Describe a time you handled a production incident." }
    ],
    "skillGaps": [
      { "skill": "Kubernetes", "importance": "High", "reason": "Listed as required in JD." }
    ],
    "resumeTips": [
      "Add metrics to your project descriptions (e.g., reduced load time by 40%)."
    ],
    "preparationRoadmap": [
      { "week": 1, "focus": "TypeScript deep dive", "resources": ["TypeScript Handbook", "Matt Pocock's TS course"] }
    ]
  }
}
```

**Error Responses:**

```json
// 401 Unauthorized
{ "error": "Unauthorized" }

// 400 Bad Request — missing job description
{ "error": "Job description is required for AI analysis." }

// 404 Not Found
{ "error": "Application not found." }

// 429 Too Many Requests
{ "error": "Rate limit exceeded. Try again in 60 seconds." }

// 500 Internal Server Error
{ "error": "AI analysis failed. Please try again." }
```

---

## Server Actions

File: `actions/applications.ts`

All Server Actions must begin with:

```typescript
"use server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
```

---

### `createApplication`

```typescript
export async function createApplication(
  formData: FormData
): Promise<ActionResult<Application>>
```

**Zod Schema:**

```typescript
const CreateApplicationSchema = z.object({
  companyName: z.string().min(1, "Company name is required").max(100),
  roleTitle: z.string().min(1, "Role title is required").max(100),
  jobDescription: z.string().max(10000).optional().default(""),
  status: z.enum(["APPLIED", "SCREENING", "INTERVIEWING", "OFFER", "REJECTED", "WITHDRAWN"]).default("APPLIED"),
  applicationDate: z.string().transform((v) => new Date(v)),
  techStack: z.string().max(500).optional().default(""),
  notes: z.string().max(5000).optional().default(""),
  salaryRange: z.string().max(50).optional().default(""),
  interviewStage: z.string().max(200).optional().default(""),
})
```

**Steps:**

1. Call `auth()` — return `{ success: false, error: "Unauthorized" }` if no session.
2. Parse `formData` into object using `Object.fromEntries`.
3. Validate with `CreateApplicationSchema.safeParse`.
4. If invalid: return `{ success: false, error: validationErrorMessage }`.
5. `prisma.application.create({ data: { ...validated, userId: session.user.id } })`.
6. Return `{ success: true, data: application }`.

**On success:** Caller must call `revalidatePath("/dashboard/applications")`.

---

### `updateApplication`

```typescript
export async function updateApplication(
  id: string,
  formData: FormData
): Promise<ActionResult<Application>>
```

**Zod Schema:** Same as `CreateApplicationSchema` but all fields optional via `.partial()`.

**Steps:**

1. Auth check.
2. Validate `id` is non-empty string.
3. Validate updated fields.
4. `prisma.application.updateMany({ where: { id, userId: session.user.id }, data: {...} })`.
5. Use `updateMany` (not `update`) to safely enforce `userId` ownership without a separate fetch.
6. If `count === 0`: return `{ success: false, error: "Application not found." }`.
7. Return `{ success: true, data: updated }`.

---

### `deleteApplication`

```typescript
export async function deleteApplication(
  id: string
): Promise<ActionResult<void>>
```

**Steps:**

1. Auth check.
2. `prisma.application.deleteMany({ where: { id, userId: session.user.id } })`.
3. If `count === 0`: return `{ success: false, error: "Application not found." }`.
4. `revalidatePath("/dashboard/applications")`.
5. Return `{ success: true }`.

---

File: `actions/interview-rounds.ts`

### `createInterviewRound`

```typescript
export async function createInterviewRound(
  applicationId: string,
  formData: FormData
): Promise<ActionResult<InterviewRound>>
```

**Zod Schema:**

```typescript
const InterviewRoundSchema = z.object({
  name: z.string().min(1).max(100),
  scheduledAt: z.string().optional().transform((v) => v ? new Date(v) : undefined),
  type: z.enum(["PHONE", "TECHNICAL", "SYSTEM_DESIGN", "BEHAVIORAL", "HR", "ONSITE"]),
  outcome: z.enum(["PASSED", "FAILED", "PENDING", "CANCELLED"]).default("PENDING"),
  notes: z.string().max(5000).optional(),
})
```

**Steps:**

1. Auth check.
2. Verify application ownership: `prisma.application.findFirst({ where: { id: applicationId, userId } })`.
3. If not found: return `{ success: false, error: "Application not found." }`.
4. Validate round fields.
5. `prisma.interviewRound.create({ data: { ...validated, applicationId } })`.
6. `revalidatePath(`/dashboard/applications/${applicationId}`)`.
7. Return `{ success: true, data: round }`.

---

### `updateInterviewRound`

```typescript
export async function updateInterviewRound(
  roundId: string,
  applicationId: string,
  formData: FormData
): Promise<ActionResult<InterviewRound>>
```

**Steps:**

1. Auth check.
2. Verify ownership of parent application.
3. Validate fields.
4. `prisma.interviewRound.update({ where: { id: roundId }, data: {...} })`.
5. Revalidate path.
6. Return result.

---

### `deleteInterviewRound`

```typescript
export async function deleteInterviewRound(
  roundId: string,
  applicationId: string
): Promise<ActionResult<void>>
```

**Steps:**

1. Auth check.
2. Verify ownership of parent application.
3. `prisma.interviewRound.delete({ where: { id: roundId } })`.
4. Revalidate path.
5. Return `{ success: true }`.

---

## Shared Types

File: `types/actions.ts`

```typescript
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }
```

---

## API Error Format

All Route Handler errors follow:

```json
{
  "error": "Human-readable error message"
}
```

HTTP status codes used:

| Code | Meaning |
|---|---|
| 200 | Success |
| 400 | Bad request / validation failure |
| 401 | Not authenticated |
| 403 | Forbidden (owns no resource) |
| 404 | Resource not found |
| 429 | Rate limited |
| 500 | Internal server error |
