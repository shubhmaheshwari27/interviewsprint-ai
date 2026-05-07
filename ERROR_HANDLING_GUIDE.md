# ERROR_HANDLING_GUIDE.md

## Purpose

Defines the complete error handling strategy for InterviewSprint AI. Covers Server Action errors, Route Handler errors, rendering errors, 404s, and client-side error states.

---

## Error Handling Layers

| Layer | Mechanism | File |
|---|---|---|
| Unexpected rendering errors | `error.tsx` boundary | Per-route segment |
| 404 not found | `not-found.tsx` | Per-route segment |
| Server Action failures | `ActionResult<T>` return type | `types/actions.ts` |
| Route Handler failures | HTTP status + JSON error body | `app/api/**` |
| Client component errors | `useState` + conditional render | Individual components |
| AI failures | Caught in try/catch, returned as 500 | `app/api/ai/analyze/route.ts` |

---

## `ActionResult<T>` Type Contract

File: `types/actions.ts`

```typescript
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }
```

**Rules:**
- Server Actions NEVER throw to the client.
- All DB errors and unexpected errors are caught in try/catch.
- The `error` string is always a human-readable message (never a raw DB error message).
- The `data` field is only present when `success: true`.

**Client handling:**

```typescript
const result = await createApplication(formData)
if (!result.success) {
  setError(result.error)  // display to user
  return
}
// result.data is typed correctly here
router.push("/dashboard/applications")
```

---

## Route Handler Error Responses

All Route Handlers return errors as:

```json
{ "error": "Human-readable message" }
```

With the appropriate HTTP status code. Never return a raw error object or stack trace.

```typescript
// ✅ Correct
return NextResponse.json({ error: "Application not found." }, { status: 404 })

// ❌ Wrong
return NextResponse.json({ error: error.message }, { status: 500 })
```

---

## `error.tsx` Boundaries

Every route segment that fetches data should have an `error.tsx`. These are Client Components that display a fallback when the Server Component throws.

### `app/(dashboard)/dashboard/error.tsx`

```typescript
"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[Dashboard Error]", error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <h2 className="text-xl font-semibold text-gray-900">Something went wrong</h2>
      <p className="text-gray-500 text-sm">
        We couldn't load your dashboard data. Please try again.
      </p>
      <Button onClick={reset} variant="outline">
        Try again
      </Button>
    </div>
  )
}
```

Create identical `error.tsx` files in:
- `app/(dashboard)/dashboard/error.tsx`
- `app/(dashboard)/dashboard/applications/error.tsx`

---

## `not-found.tsx`

File: `app/(dashboard)/dashboard/applications/[id]/not-found.tsx`

```typescript
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function ApplicationNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <h2 className="text-xl font-semibold">Application not found</h2>
      <p className="text-gray-500 text-sm">
        This application may have been deleted or doesn't exist.
      </p>
      <Button asChild variant="outline">
        <Link href="/dashboard/applications">Back to applications</Link>
      </Button>
    </div>
  )
}
```

Triggered by calling `notFound()` in the page Server Component when the DB returns null.

---

## AI Error Handling

The AI analysis panel handles errors gracefully:

1. Network failure (fetch throws): Catch in try/catch, set `error = "Network error. Check your connection."`
2. 400 Bad Request: Display `data.error` message (e.g., "Job description required")
3. 429 Rate Limited: Display `data.error` message with hint to wait
4. 500 Server Error: Display `data.error` or generic fallback

```typescript
try {
  const res = await fetch("/api/ai/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ applicationId }),
  })

  const data = await res.json()

  if (!res.ok) {
    setError(data.error ?? "Analysis failed. Please try again.")
    return
  }

  setAnalysis(data.data)
} catch {
  setError("Network error. Please check your connection and try again.")
} finally {
  setLoading(false)
}
```

---

## Prisma Error Handling

Never expose raw Prisma errors to the client. Handle known error codes:

```typescript
import { Prisma } from "@prisma/client"

try {
  await prisma.user.create({ data: { email, password } })
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      // Unique constraint violation
      return { success: false, error: "An account with this email already exists." }
    }
  }
  console.error("[registerUser Error]", error)
  return { success: false, error: "Registration failed. Please try again." }
}
```

Common Prisma error codes to handle:
- `P2002` — Unique constraint violation
- `P2025` — Record not found (for `update`/`delete` on non-existent record)

---

## Console Logging Convention

Log server-side errors with a `[Context Error]` prefix so they're easy to filter in Vercel logs:

```typescript
console.error("[createApplication Error]", error)
console.error("[AI Analysis Error]", error)
console.error("[registerUser Error]", error)
```

Never log sensitive data (passwords, tokens, session data).

---

## Global 404 Page

File: `app/not-found.tsx`

```typescript
import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-gray-500">Page not found.</p>
      <Link href="/" className="text-blue-600 underline">Go home</Link>
    </div>
  )
}
```
