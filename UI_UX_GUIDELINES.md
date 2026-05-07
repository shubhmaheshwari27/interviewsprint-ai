# UI_UX_GUIDELINES.md

## Purpose

Defines the design system, layout structure, component styling conventions, and UX patterns for InterviewSprint AI. This document ensures visual consistency across all pages.

---

## Design Principles

1. **Clean and professional** — SaaS dashboard aesthetic, not a portfolio site.
2. **Information density** — show meaningful data without clutter.
3. **Responsive-first** — every layout works on 375px mobile and 1440px desktop.
4. **Accessible** — color alone never conveys information; labels always present.
5. **Fast perceived performance** — loading skeletons match content shape.

---

## Color System

Using Tailwind CSS default palette. Do not introduce custom colors.

| Token | Tailwind Class | Use |
|---|---|---|
| Primary action | `bg-blue-600`, `hover:bg-blue-700` | Buttons, links |
| Destructive | `bg-red-600`, `hover:bg-red-700` | Delete actions |
| Surface | `bg-white`, `dark:bg-gray-900` | Card backgrounds |
| Background | `bg-gray-50` | Page background |
| Border | `border-gray-200` | Card borders, dividers |
| Text primary | `text-gray-900` | Headings, labels |
| Text secondary | `text-gray-500` | Subtitles, metadata |
| Text muted | `text-gray-400` | Placeholder, disabled |

### Status Color Map

| Status | Text | Background | Tailwind classes |
|---|---|---|---|
| APPLIED | `text-blue-700` | `bg-blue-100` | `text-blue-700 bg-blue-100` |
| SCREENING | `text-purple-700` | `bg-purple-100` | `text-purple-700 bg-purple-100` |
| INTERVIEWING | `text-yellow-700` | `bg-yellow-100` | `text-yellow-700 bg-yellow-100` |
| OFFER | `text-green-700` | `bg-green-100` | `text-green-700 bg-green-100` |
| REJECTED | `text-red-700` | `bg-red-100` | `text-red-700 bg-red-100` |
| WITHDRAWN | `text-gray-600` | `bg-gray-100` | `text-gray-600 bg-gray-100` |

---

## Typography

Font: **Inter** (Google Fonts via `next/font/google`)

```typescript
// app/layout.tsx
import { Inter } from "next/font/google"
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
```

| Usage | Class |
|---|---|
| Page title | `text-2xl font-bold text-gray-900` |
| Section heading | `text-lg font-semibold text-gray-800` |
| Card title | `text-base font-medium text-gray-900` |
| Body text | `text-sm text-gray-700` |
| Secondary text | `text-sm text-gray-500` |
| Small label | `text-xs text-gray-400` |

---

## Layout Structure

### Dashboard Layout

File: `app/(dashboard)/layout.tsx`

```
┌─────────────────────────────────────────────────────┐
│ Sidebar (w-64, hidden on mobile)  │  Main Content   │
│                                   │                 │
│  Logo                             │  TopNav         │
│  ─────────                        │  ─────────────  │
│  Dashboard                        │                 │
│  Applications                     │  {children}     │
│                                   │                 │
│  ─────────                        │                 │
│  User / Signout                   │                 │
└─────────────────────────────────────────────────────┘
```

On mobile: Sidebar hidden, TopNav shows hamburger → mobile drawer.

```typescript
// app/(dashboard)/layout.tsx
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar className="hidden md:flex" />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
```

### Auth Layout

File: `app/(auth)/layout.tsx`

```
┌─────────────────────────────────────────────────────┐
│                                                      │
│         Logo + App Name (centered)                  │
│                                                      │
│   ┌─────────────────────────────────────────────┐   │
│   │            Auth Card (max-w-md)             │   │
│   │                                             │   │
│   └─────────────────────────────────────────────┘   │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## Component Styling Conventions

### Cards

Use `shadcn/ui` Card component:

```tsx
<Card className="p-6">
  <CardHeader className="pb-2">
    <CardTitle className="text-base font-medium text-gray-700">Total Applications</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-3xl font-bold text-gray-900">{count}</p>
  </CardContent>
</Card>
```

### Buttons

Use `shadcn/ui` Button with correct variants:

| Variant | Use case |
|---|---|
| `default` | Primary actions (Save, Create) |
| `outline` | Secondary actions (Cancel, Back) |
| `destructive` | Delete actions |
| `ghost` | Navigation links, icon-only actions |
| `link` | Inline text links |

### Forms

```tsx
<div className="space-y-4">
  <div className="space-y-1">
    <Label htmlFor="companyName">Company Name</Label>
    <Input
      id="companyName"
      placeholder="e.g. Stripe"
      {...form.register("companyName")}
      aria-invalid={!!form.formState.errors.companyName}
    />
    {form.formState.errors.companyName && (
      <p className="text-xs text-red-500">{form.formState.errors.companyName.message}</p>
    )}
  </div>
</div>
```

### Status Badge

```tsx
<span className={cn(
  "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
  statusConfig[status].bgColor,
  statusConfig[status].color
)}>
  {statusConfig[status].label}
</span>
```

---

## Page Layouts

### Dashboard Home

```
Row 1: 3 stat cards (Total, Active (non-rejected/withdrawn), Offers)
Row 2: Status distribution chart (left, 60%) | Recent applications (right, 40%)
```

### Applications List

```
Header: "Applications" title + "New Application" button (right)
Filter bar: Status dropdown | Search input | Sort toggle
Application grid/list
Pagination bar
```

On mobile: filter bar stacks vertically.

### Application Detail

```
Header: Company name (large) | Status badge | Edit button | Delete button
Subtitle: Role title | Application date
Tabs OR sections:
  Overview (metadata: salary, tech stack, interview stage)
  Job Description (full text in a scrollable box)
  Notes (editable text area)
  Interview Rounds (list + add button)
  AI Analysis (full panel)
```

---

## Loading Skeletons

Every `loading.tsx` must visually match the layout of the page it represents.

Use `Skeleton` from shadcn/ui:

```tsx
// Stat card skeleton
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  {Array.from({ length: 3 }).map((_, i) => (
    <Skeleton key={i} className="h-28 rounded-xl" />
  ))}
</div>
```

```tsx
// Application card skeleton
{Array.from({ length: 5 }).map((_, i) => (
  <Skeleton key={i} className="h-20 rounded-lg w-full" />
))}
```

---

## Icons

Use **lucide-react** exclusively. No other icon library.

Common icons used:

| Icon | Import | Use |
|---|---|---|
| `LayoutDashboard` | `lucide-react` | Dashboard nav link |
| `Briefcase` | `lucide-react` | Applications nav link |
| `Plus` | `lucide-react` | "New" buttons |
| `Pencil` | `lucide-react` | Edit button |
| `Trash2` | `lucide-react` | Delete button |
| `Search` | `lucide-react` | Search bar |
| `Sparkles` | `lucide-react` | AI analysis button |
| `ChevronDown` | `lucide-react` | Select dropdowns |
| `LogOut` | `lucide-react` | Sign out |
| `User` | `lucide-react` | User avatar fallback |

---

## Responsive Breakpoints

| Breakpoint | Tailwind prefix | Width |
|---|---|---|
| Mobile | (none / default) | 0–767px |
| Tablet+ | `md:` | 768px+ |
| Desktop | `lg:` | 1024px+ |

Key responsive rules:
- Sidebar: `hidden md:flex` (hidden on mobile)
- Stat cards grid: `grid-cols-1 md:grid-cols-3`
- Application list: stacked cards on mobile, table-like layout on desktop
- Forms: `max-w-2xl mx-auto` on desktop, full-width on mobile
