# STATE_MANAGEMENT.md

## Purpose

Defines the state management strategy for InterviewSprint AI. This app uses a server-first approach — the majority of state lives in the URL and the database, not in React state. Client state is minimal and scoped to individual components.

---

## State Management Philosophy

This application does NOT use global state management libraries (Redux, Zustand, Jotai, etc.).

**Rationale:**
- SSR-first architecture means most data is fetched server-side and passed as props.
- Application data lives in the database — the server is the source of truth.
- URL search params handle filter/search state naturally and persistently.
- The scope of the app does not warrant global client state.

---

## State Categories

### 1. Server State (Database + RSC)

All job applications, interview rounds, AI analyses, and dashboard stats are **server state**. They are:
- Fetched in Server Components using Prisma directly.
- Passed as props to Client Components.
- Refreshed via `revalidatePath()` after Server Action mutations.

**No client-side caching or polling.** Data is always fresh from the server on each navigation.

### 2. URL State (Search Params)

Application list filters are stored in URL search params. This allows:
- Shareable URLs.
- Browser back/forward navigation works correctly.
- Filters persist on page refresh.

**Managed by:** `SearchFilterBar.tsx` (client component that reads/writes URL params)

```typescript
// Reading URL state in a Server Component
export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string; sort?: string; page?: string }
}) {
  const status = searchParams.status
  const q = searchParams.q
  const sort = searchParams.sort ?? "desc"
  const page = parseInt(searchParams.page ?? "1", 10)
  // pass to Prisma query...
}
```

```typescript
// Writing URL state in SearchFilterBar (client)
"use client"
import { useRouter, useSearchParams, usePathname } from "next/navigation"

function SearchFilterBar() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    params.delete("page") // reset to page 1 on filter change
    router.push(`${pathname}?${params.toString()}`)
  }
}
```

### 3. Local UI State

Managed with `useState` inside individual Client Components. Scoped and never shared.

| Component | State | Type |
|---|---|---|
| `LoginForm` | `loading`, `error` | `boolean`, `string \| null` |
| `ApplicationForm` | `isPending` | via `useTransition` |
| `DeleteApplicationButton` | `open` (dialog), `isPending` | `boolean` |
| `AIAnalysisPanel` | `loading`, `error`, `analysis` | typed states |
| `InterviewRoundForm` | `open` (dialog), form state | `boolean`, RHF |
| `SearchFilterBar` | search input value | `string` (debounced) |
| `MobileNav` | `open` | `boolean` |

### 4. Form State

All forms use **React Hook Form** with Zod resolvers. Form state lives inside RHF and is not hoisted to parent components.

---

## Optimistic UI

Optimistic updates are used in one place: **deleting an application from the list view**.

When the user clicks delete and confirms, the application is immediately removed from the UI list before the Server Action completes. If the action fails, the application is restored.

File: `hooks/useOptimisticApplications.ts`

```typescript
"use client"

import { useOptimistic } from "react"
import type { Application } from "@prisma/client"

export function useOptimisticApplications(initialApplications: Application[]) {
  const [optimisticApps, removeOptimistic] = useOptimistic(
    initialApplications,
    (state: Application[], idToRemove: string) =>
      state.filter((app) => app.id !== idToRemove)
  )

  return { optimisticApps, removeOptimistic }
}
```

Usage in the applications list component:

```typescript
const { optimisticApps, removeOptimistic } = useOptimisticApplications(applications)

async function handleDelete(id: string) {
  removeOptimistic(id)  // instant UI update
  const result = await deleteApplication(id)
  if (!result.success) {
    // React will revert optimistic state automatically
    // Show error toast
  }
}
```

---

## Data Freshness Strategy

| Scenario | Strategy |
|---|---|
| User navigates to applications list | Full SSR re-fetch (fresh data) |
| User submits a form (Server Action) | `revalidatePath()` marks data stale, next navigation re-fetches |
| User stays on page after action | `router.refresh()` triggers RSC re-render with fresh data |
| AI analysis completes | `setAnalysis(data.data)` sets local state — no page refresh needed |

---

## No Context Providers Needed

Because this app uses server components and URL state for primary data flow, there is no need for React Context for application data.

The only Context providers used are:
- `SessionProvider` from Auth.js (required for `useSession()` in client components)
- No other providers.

---

## `useDebounce` Hook

File: `hooks/useDebounce.ts`

```typescript
import { useState, useEffect } from "react"

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}
```

Used in `SearchFilterBar` to avoid triggering URL updates on every keystroke:

```typescript
const [inputValue, setInputValue] = useState(currentQ ?? "")
const debouncedQuery = useDebounce(inputValue, 300)

useEffect(() => {
  updateFilter("q", debouncedQuery)
}, [debouncedQuery])
```
