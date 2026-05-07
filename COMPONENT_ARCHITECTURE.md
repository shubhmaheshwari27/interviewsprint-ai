# COMPONENT_ARCHITECTURE.md

## Purpose

Defines the complete component architecture for InterviewSprint AI. Specifies exactly which components are Server Components vs Client Components, their props, responsibilities, and how they compose together.

---

## Server vs Client Component Rules

| If the component… | Make it… |
|---|---|
| Fetches data from the database | Server Component |
| Uses `useState`, `useEffect`, `useRef` | Client Component |
| Has event handlers (onClick, onChange) | Client Component |
| Uses browser APIs | Client Component |
| Only renders HTML from props | Server Component (preferred) |
| Uses Recharts | Client Component |
| Uses React Hook Form | Client Component |

---

## Page Component Map

### `app/(dashboard)/dashboard/page.tsx`

**Type:** Server Component (async)

**Data fetched:**

```typescript
// Parallel data fetching
const [totalCount, statusCounts, recentApplications] = await Promise.all([
  prisma.application.count({ where: { userId } }),
  prisma.application.groupBy({
    by: ["status"],
    where: { userId },
    _count: { status: true },
  }),
  prisma.application.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: 5,
    select: { id: true, companyName: true, roleTitle: true, status: true, updatedAt: true },
  }),
])
```

**Renders:**

```tsx
<div>
  <StatsCards total={totalCount} statusCounts={statusCounts} />
  <StatusChart data={statusCounts} />          {/* Client Component */}
  <RecentApplications applications={recentApplications} />
</div>
```

---

### `app/(dashboard)/dashboard/applications/page.tsx`

**Type:** Server Component (async)

**Props:** `searchParams: { status?: string; q?: string; sort?: string; page?: string }`

**Data fetched:**

```typescript
const where = {
  userId,
  ...(status ? { status: status as ApplicationStatus } : {}),
  ...(q ? { companyName: { contains: q, mode: "insensitive" } } : {}),
}

const [applications, total] = await Promise.all([
  prisma.application.findMany({
    where,
    orderBy: { applicationDate: sort === "asc" ? "asc" : "desc" },
    skip: (page - 1) * 10,
    take: 10,
  }),
  prisma.application.count({ where }),
])
```

**Renders:**

```tsx
<div>
  <SearchFilterBar currentStatus={status} currentQ={q} currentSort={sort} /> {/* Client */}
  <div>
    {applications.map((app) => <ApplicationCard key={app.id} application={app} />)}
  </div>
  <Pagination total={total} page={page} pageSize={10} />  {/* Client */}
</div>
```

---

### `app/(dashboard)/dashboard/applications/[id]/page.tsx`

**Type:** Server Component (async)

**Data fetched:**

```typescript
const application = await prisma.application.findFirst({
  where: { id: params.id, userId },
  include: { interviewRounds: { orderBy: { scheduledAt: "asc" } }, aiAnalysis: true },
})

if (!application) notFound()
```

**Renders:**

```tsx
<div>
  {/* Header: company, role, status badge, edit/delete buttons */}
  <ApplicationHeader application={application} />

  {/* Metadata grid: date, salary, tech stack */}
  <ApplicationMetadata application={application} />

  {/* Job description text */}
  <JobDescriptionSection jobDescription={application.jobDescription} />

  {/* Notes section */}
  <NotesSection notes={application.notes} />

  {/* Interview rounds list + add round form */}
  <InterviewRoundList rounds={application.interviewRounds} applicationId={application.id} />

  {/* AI Analysis panel */}
  <AIAnalysisPanel
    applicationId={application.id}
    hasJobDescription={!!application.jobDescription}
    initialAnalysis={application.aiAnalysis}
  />
</div>
```

---

## Component Specifications

### `components/auth/LoginForm.tsx`

**Type:** Client Component

**Props:** `{ callbackUrl?: string }`

**State:** `error: string | null`, `loading: boolean`

**Behavior:**
- Google button calls `signIn("google", { callbackUrl: "/dashboard" })`
- Credentials form calls `signIn("credentials", { email, password, redirectTo: callbackUrl || "/dashboard" })`
- Reads `useSearchParams().get("error")` and maps to display message

---

### `components/applications/ApplicationForm.tsx`

**Type:** Client Component

**Props:**

```typescript
{
  mode: "create" | "edit"
  initialData?: Partial<Application>  // provided in edit mode
}
```

**Library:** `react-hook-form` + `@hookform/resolvers/zod`

**Zod schema:** Reuses `CreateApplicationSchema` from `actions/applications.ts` (exported for client use)

**Fields rendered:**
- `companyName` — Input
- `roleTitle` — Input
- `status` — Select (enum options)
- `applicationDate` — Input type="date"
- `jobDescription` — Textarea (tall)
- `techStack` — Input (comma-separated hint)
- `notes` — Textarea
- `salaryRange` — Input
- `interviewStage` — Input

**On submit:**
- In create mode: calls `createApplication(formData)` Server Action, then `router.push("/dashboard/applications")`
- In edit mode: calls `updateApplication(id, formData)`, then `router.refresh()`

**Validation errors** displayed inline below each field using `form.formState.errors`.

---

### `components/applications/ApplicationStatusBadge.tsx`

**Type:** Server Component (no interactivity)

**Props:** `{ status: ApplicationStatus }`

**Renders:**

```tsx
import { statusConfig } from "@/lib/utils"

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  const config = statusConfig[status]
  return (
    <span className={cn("px-2 py-1 rounded-full text-xs font-medium", config.bgColor, config.color)}>
      {config.label}
    </span>
  )
}
```

---

### `components/applications/SearchFilterBar.tsx`

**Type:** Client Component

**Props:**

```typescript
{
  currentStatus?: string
  currentQ?: string
  currentSort?: string
}
```

**Behavior:**
- Uses `useRouter()` and `useSearchParams()` to update URL params on change.
- Debounces search input using `useDebounce` hook (300ms).
- Status dropdown immediately updates URL on change.
- Sort toggle immediately updates URL on change.

---

### `components/applications/DeleteApplicationButton.tsx`

**Type:** Client Component

**Props:** `{ applicationId: string }`

**Behavior:**
- Renders a "Delete" button (destructive variant).
- On click: opens a `Dialog` (shadcn/ui) with confirmation message.
- On confirm: calls `deleteApplication(applicationId)` Server Action.
- Shows loading state during deletion.
- On success: `router.push("/dashboard/applications")`.
- On error: shows toast or inline error message.

---

### `components/dashboard/StatusChart.tsx`

**Type:** Client Component

**Props:**

```typescript
{
  data: Array<{ status: ApplicationStatus; _count: { status: number } }>
}
```

**Renders:** Recharts `PieChart` with `Pie`, `Cell`, `Tooltip`, `Legend`.

**Colors mapped from** `statusConfig`:
- APPLIED → blue
- SCREENING → purple
- INTERVIEWING → yellow
- OFFER → green
- REJECTED → red
- WITHDRAWN → gray

---

### `components/applications/AIAnalysisPanel.tsx`

**Type:** Client Component

**Props:**

```typescript
{
  applicationId: string
  hasJobDescription: boolean
  initialAnalysis: AIAnalysis | null
}
```

**State:** `loading`, `error`, `analysis` (initialized from `initialAnalysis` prop)

See `AI_FEATURES.md` for full implementation.

---

### `components/layout/Sidebar.tsx`

**Type:** Client Component (needs `usePathname` for active state)

**Navigation links:**

```typescript
const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/applications", label: "Applications", icon: Briefcase },
]
```

**Renders:**
- Logo at top
- Nav links with active highlight
- User avatar + signout button at bottom

---

## Loading Skeletons

Every page with a `loading.tsx` must render a skeleton that matches the layout of the actual page content.

### `app/(dashboard)/dashboard/loading.tsx`

```tsx
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
      <Skeleton className="h-64 rounded-xl" />
      <Skeleton className="h-48 rounded-xl" />
    </div>
  )
}
```

---

## Component Import Conventions

Always use absolute imports configured via `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

Examples:
- `import { Button } from "@/components/ui/button"`
- `import { prisma } from "@/lib/prisma"`
- `import { createApplication } from "@/actions/applications"`
