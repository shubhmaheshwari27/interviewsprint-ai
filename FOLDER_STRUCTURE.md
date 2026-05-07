# FOLDER_STRUCTURE.md

## Purpose

Defines the exact file and folder structure for the InterviewSprint AI project. Every file listed here must be created. Every path used in other documentation files references this structure.

---

## Complete Folder Structure

```
interviewsprint-ai/
│
├── app/                                    # Next.js App Router root
│   ├── layout.tsx                          # Root layout (SessionProvider, fonts)
│   ├── page.tsx                            # Marketing landing page (/)
│   ├── globals.css                         # Global Tailwind styles
│   │
│   ├── (auth)/                             # Route group: unauthenticated pages
│   │   ├── layout.tsx                      # Centered card layout for auth pages
│   │   ├── login/
│   │   │   └── page.tsx                    # Login page (SSR, checks session)
│   │   └── register/
│   │       └── page.tsx                    # Register page
│   │
│   ├── (dashboard)/                        # Route group: protected pages
│   │   ├── layout.tsx                      # Sidebar + top nav layout
│   │   └── dashboard/
│   │       ├── page.tsx                    # Dashboard home (stats, charts)
│   │       ├── loading.tsx                 # Dashboard loading skeleton
│   │       ├── error.tsx                   # Dashboard error boundary
│   │       └── applications/
│   │           ├── page.tsx                # Application list with search/filter
│   │           ├── loading.tsx             # List loading skeleton
│   │           ├── new/
│   │           │   └── page.tsx            # New application form page
│   │           └── [id]/
│   │               ├── page.tsx            # Application detail page
│   │               ├── loading.tsx         # Detail loading skeleton
│   │               ├── edit/
│   │               │   └── page.tsx        # Edit application form page
│   │               └── not-found.tsx       # 404 for invalid application ID
│   │
│   └── api/
│       ├── auth/
│       │   └── [...nextauth]/
│       │       └── route.ts                # Auth.js route handler
│       └── ai/
│           └── analyze/
│               └── route.ts               # AI analysis endpoint
│
├── actions/                               # Server Actions ("use server")
│   ├── applications.ts                    # CRUD actions for applications
│   ├── interview-rounds.ts               # CRUD actions for interview rounds
│   └── auth.ts                            # registerUser action
│
├── components/
│   ├── ui/                                # shadcn/ui components (auto-generated)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── badge.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── select.tsx
│   │   ├── textarea.tsx
│   │   ├── accordion.tsx
│   │   ├── alert.tsx
│   │   ├── skeleton.tsx
│   │   ├── separator.tsx
│   │   ├── dropdown-menu.tsx
│   │   └── avatar.tsx
│   │
│   ├── auth/
│   │   ├── LoginForm.tsx                  # "use client" — credentials + Google login
│   │   └── RegisterForm.tsx               # "use client" — registration form
│   │
│   ├── layout/
│   │   ├── Sidebar.tsx                    # "use client" — sidebar navigation
│   │   ├── TopNav.tsx                     # "use client" — top bar with user menu
│   │   └── MobileNav.tsx                  # "use client" — mobile drawer nav
│   │
│   ├── dashboard/
│   │   ├── StatsCards.tsx                 # Server Component — summary stat cards
│   │   ├── StatusChart.tsx                # "use client" — Recharts pie chart
│   │   └── RecentApplications.tsx         # Server Component — recent list
│   │
│   ├── applications/
│   │   ├── ApplicationCard.tsx            # Server Component — card in list view
│   │   ├── ApplicationForm.tsx            # "use client" — create/edit form
│   │   ├── ApplicationStatusBadge.tsx     # Server Component — colored status pill
│   │   ├── DeleteApplicationButton.tsx    # "use client" — delete with confirm dialog
│   │   ├── SearchFilterBar.tsx            # "use client" — search/filter/sort controls
│   │   ├── Pagination.tsx                 # "use client" — pagination controls
│   │   └── AIAnalysisPanel.tsx            # "use client" — AI trigger + results
│   │
│   └── interview-rounds/
│       ├── InterviewRoundList.tsx         # Server Component — round list
│       ├── InterviewRoundForm.tsx         # "use client" — add/edit round form
│       └── DeleteRoundButton.tsx          # "use client" — delete round
│
├── hooks/                                 # Custom React hooks (client-side)
│   ├── useDebounce.ts                     # Debounce hook for search input
│   └── useOptimisticApplications.ts       # Optimistic UI for status updates
│
├── lib/
│   ├── prisma.ts                          # Prisma client singleton
│   ├── auth.ts                            # Auth.js configuration + exports
│   ├── gemini.ts                          # Gemini AI client
│   ├── ai-prompt.ts                       # AI prompt builder function
│   ├── ai-validation.ts                   # Zod schema for AI response
│   ├── rate-limiter.ts                    # In-memory rate limiter
│   └── utils.ts                           # cn(), formatDate(), statusConfig
│
├── types/
│   ├── index.ts                           # ApplicationWithRelations, etc.
│   ├── actions.ts                         # ActionResult<T> type
│   └── next-auth.d.ts                     # Session type augmentation
│
├── prisma/
│   ├── schema.prisma                      # Database schema
│   ├── migrations/                        # Auto-generated migration files
│   └── seed.ts                            # Optional dev seed data
│
├── public/
│   ├── logo.svg                           # App logo
│   └── og-image.png                       # Open Graph image
│
├── .env.example                           # Environment variable template
├── .env.local                             # Local secrets (gitignored)
├── .gitignore
├── middleware.ts                          # Route protection middleware
├── next.config.ts                         # Next.js configuration
├── tailwind.config.ts                     # Tailwind configuration
├── tsconfig.json                          # TypeScript configuration
├── components.json                        # shadcn/ui configuration
└── package.json
```

---

## Key File Responsibilities

| File | Responsibility |
|---|---|
| `middleware.ts` | Blocks unauthenticated access to `/dashboard/**` |
| `lib/auth.ts` | Auth.js config, exports `auth`, `signIn`, `signOut`, `handlers` |
| `lib/prisma.ts` | Prisma Client singleton with dev hot-reload guard |
| `lib/utils.ts` | `cn()` classname helper, `formatDate()`, `statusConfig` map |
| `actions/applications.ts` | All application mutations (create, update, delete) |
| `actions/interview-rounds.ts` | All round mutations |
| `actions/auth.ts` | `registerUser` Server Action |
| `app/api/ai/analyze/route.ts` | AI analysis with rate limiting |
| `types/next-auth.d.ts` | Adds `session.user.id` typing |

---

## `lib/utils.ts` Contents

```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"
import type { ApplicationStatus } from "@prisma/client"

// Tailwind class merger
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format a date to "Jan 15, 2024"
export function formatDate(date: Date | string): string {
  return format(new Date(date), "MMM d, yyyy")
}

// Status display config
export const statusConfig: Record<
  ApplicationStatus,
  { label: string; color: string; bgColor: string }
> = {
  APPLIED:      { label: "Applied",      color: "text-blue-700",   bgColor: "bg-blue-100"   },
  SCREENING:    { label: "Screening",    color: "text-purple-700", bgColor: "bg-purple-100" },
  INTERVIEWING: { label: "Interviewing", color: "text-yellow-700", bgColor: "bg-yellow-100" },
  OFFER:        { label: "Offer",        color: "text-green-700",  bgColor: "bg-green-100"  },
  REJECTED:     { label: "Rejected",     color: "text-red-700",    bgColor: "bg-red-100"    },
  WITHDRAWN:    { label: "Withdrawn",    color: "text-gray-700",   bgColor: "bg-gray-100"   },
}
```

---

## Naming Conventions

| Convention | Rule |
|---|---|
| Page files | `page.tsx` always |
| Layout files | `layout.tsx` always |
| Client components | PascalCase `.tsx`, include `"use client"` directive |
| Server components | PascalCase `.tsx`, no directive needed |
| Server Actions | camelCase function names in `actions/*.ts` |
| Route Handlers | `route.ts` in `app/api/*/route.ts` |
| Hooks | `use` prefix, camelCase in `hooks/` |
| Lib utilities | camelCase in `lib/*.ts` |
| Prisma models | PascalCase (Prisma convention) |
| DB table names | snake_case via `@@map()` |
