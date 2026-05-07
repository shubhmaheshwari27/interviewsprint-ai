# PERFORMANCE_OPTIMIZATION.md

## Purpose

Defines the performance optimization strategy for InterviewSprint AI. All optimizations listed here are practical, implementable in 4 days, and appropriate for a Vercel-deployed Next.js app.

---

## Core Performance Strategy

**Primary approach:** Maximize server-side rendering to eliminate client-side data fetching waterfalls.

**Secondary approach:** Use route-level loading states and skeletons so the UI never feels frozen.

**Tertiary approach:** Keep the JavaScript bundle lean by making components Server Components unless interactivity is explicitly required.

---

## SSR and Server Components

### Dashboard page — parallel data fetching

Never fetch sequentially in a Server Component. Always use `Promise.all`:

```typescript
// ✅ Parallel — all 3 queries execute simultaneously
const [totalCount, statusCounts, recentApplications] = await Promise.all([
  prisma.application.count({ where: { userId } }),
  prisma.application.groupBy({ ... }),
  prisma.application.findMany({ ... }),
])

// ❌ Sequential — each waits for the previous
const totalCount = await prisma.application.count(...)
const statusCounts = await prisma.application.groupBy(...)
const recentApplications = await prisma.application.findMany(...)
```

### Application detail page — include relations in single query

```typescript
// ✅ One query with includes — single DB round trip
const application = await prisma.application.findFirst({
  where: { id, userId },
  include: {
    interviewRounds: { orderBy: { scheduledAt: "asc" } },
    aiAnalysis: true,
  },
})

// ❌ Three separate queries — three round trips
const application = await prisma.application.findFirst(...)
const rounds = await prisma.interviewRound.findMany(...)
const analysis = await prisma.aIAnalysis.findFirst(...)
```

---

## Database Query Optimization

### Indexes

The Prisma schema defines these indexes (see `DATABASE_SCHEMA.md`):

```prisma
@@index([userId])
@@index([userId, status])
@@index([userId, createdAt(sort: Desc)])
```

These cover the three most common query patterns:
1. All applications for a user.
2. Applications filtered by status.
3. Applications sorted by date (dashboard recent list).

### Pagination — database-level

Always paginate at the database level:

```typescript
prisma.application.findMany({
  where: { userId },
  skip: (page - 1) * PAGE_SIZE,
  take: PAGE_SIZE,
  orderBy: { applicationDate: "desc" },
})
```

`PAGE_SIZE = 10`. This is defined as a constant in `lib/utils.ts`:

```typescript
export const PAGE_SIZE = 10
```

### Select only needed fields

For the applications list view, don't fetch `jobDescription` (large text field):

```typescript
prisma.application.findMany({
  where,
  select: {
    id: true,
    companyName: true,
    roleTitle: true,
    status: true,
    applicationDate: true,
    techStack: true,
    interviewStage: true,
    updatedAt: true,
    // jobDescription intentionally omitted — not needed in list view
  },
})
```

---

## Route-Level Loading States

Every page segment with async data fetching has a `loading.tsx` file. This ensures Next.js shows the skeleton immediately while the Server Component is resolving.

Files required:
- `app/(dashboard)/dashboard/loading.tsx`
- `app/(dashboard)/dashboard/applications/loading.tsx`
- `app/(dashboard)/dashboard/applications/[id]/loading.tsx`

---

## Image Optimization

Use `next/image` for any images:

```tsx
import Image from "next/image"

<Image
  src={session.user.image ?? "/default-avatar.png"}
  alt={session.user.name ?? "User avatar"}
  width={32}
  height={32}
  className="rounded-full"
/>
```

The landing page (`/`) uses `next/image` for any hero images.

---

## JavaScript Bundle Size

### Keep components as Server Components by default

Client Components add to the JS bundle. Server Components do not.

Only add `"use client"` when:
- The component uses `useState`, `useEffect`, `useRef`.
- The component uses browser-only APIs.
- The component has user event handlers.

### Recharts lazy loading

The status chart is only shown on the dashboard. Recharts is a large library.

Since `StatusChart.tsx` is already a Client Component, Next.js will code-split it automatically as part of the client component bundle.

No additional dynamic import needed — Next.js handles this at the route level.

---

## Font Loading

Use `next/font` for zero layout shift:

```typescript
// app/layout.tsx
import { Inter } from "next/font/google"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">{children}</body>
    </html>
  )
}
```

---

## Tailwind CSS Purging

Tailwind removes unused CSS classes in production automatically via its JIT compiler. No additional configuration required.

Ensure `tailwind.config.ts` content paths cover all source files:

```typescript
export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
}
```

---

## Vercel Edge Network

Vercel serves static assets (JS bundles, CSS, images) from its global CDN automatically. No configuration needed.

API routes (Route Handlers) run as serverless functions in the closest available region to the user.

---

## Performance Checklist

| Item | Status |
|---|---|
| Parallel data fetching in Server Components | Required |
| Database indexes on userId + status + createdAt | Required (in schema) |
| Pagination at DB level (skip/take) | Required |
| Select only needed fields in list queries | Required |
| Route loading skeletons (loading.tsx) | Required |
| next/image for all img elements | Required |
| next/font for Inter font | Required |
| No sequential awaits in Server Components | Required |
| Server Components by default | Required |
