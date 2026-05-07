# ACCESSIBILITY_GUIDE.md

## Purpose

Defines accessibility (a11y) requirements and implementation patterns for InterviewSprint AI. Every item in this document is a concrete implementation requirement — not a recommendation. The target conformance level is WCAG 2.1 AA.

---

## Core Accessibility Rules

| Rule | Applies To |
|---|---|
| Every form input has an associated `<label>` | All forms |
| Color is never the sole indicator of meaning | Status badges, charts, alerts |
| Interactive elements are keyboard-navigable | Buttons, links, dropdowns, dialogs |
| Focus is trapped inside open modals/dialogs | Delete confirm dialog, round form dialog |
| ARIA attributes supplement where native HTML is insufficient | Custom components |
| Images have descriptive `alt` text (or `alt=""` if decorative) | All `<img>` / `next/image` |
| Sufficient color contrast (4.5:1 for text, 3:1 for UI components) | All text and interactive elements |

---

## Form Accessibility

### Label Association

Every input must have a label connected via `htmlFor` / `id`:

```tsx
// ✅ Correct
<div className="space-y-1">
  <Label htmlFor="companyName">Company Name</Label>
  <Input
    id="companyName"
    name="companyName"
    placeholder="e.g. Stripe"
    aria-required="true"
    aria-invalid={!!errors.companyName}
    aria-describedby={errors.companyName ? "companyName-error" : undefined}
    {...register("companyName")}
  />
  {errors.companyName && (
    <p id="companyName-error" className="text-xs text-red-500" role="alert">
      {errors.companyName.message}
    </p>
  )}
</div>

// ❌ Wrong — no label association
<p>Company Name</p>
<Input placeholder="e.g. Stripe" />
```

### Required Fields

Mark required fields visually and programmatically:

```tsx
<Label htmlFor="companyName">
  Company Name <span aria-hidden="true" className="text-red-500">*</span>
</Label>
<Input
  id="companyName"
  aria-required="true"
  ...
/>
```

Add a note at the top of the form:

```tsx
<p className="text-sm text-gray-500">
  Fields marked with <span aria-hidden="true" className="text-red-500">*</span>{" "}
  <span className="sr-only">asterisk</span> are required.
</p>
```

### Validation Error Announcements

Use `role="alert"` on validation error messages so screen readers announce them immediately:

```tsx
{errors.companyName && (
  <p id="companyName-error" role="alert" className="text-xs text-red-500 mt-1">
    {errors.companyName.message}
  </p>
)}
```

### Select Elements

shadcn/ui `Select` is built on Radix UI and is keyboard-accessible by default. Always include a label:

```tsx
<Label htmlFor="status">Status</Label>
<Select
  name="status"
  defaultValue="APPLIED"
  aria-label="Application status"
>
  <SelectTrigger id="status">
    <SelectValue placeholder="Select status" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="APPLIED">Applied</SelectItem>
    <SelectItem value="SCREENING">Screening</SelectItem>
    <SelectItem value="INTERVIEWING">Interviewing</SelectItem>
    <SelectItem value="OFFER">Offer</SelectItem>
    <SelectItem value="REJECTED">Rejected</SelectItem>
    <SelectItem value="WITHDRAWN">Withdrawn</SelectItem>
  </SelectContent>
</Select>
```

---

## Status Badges — Never Color-Only

Status badges always include the text label. Color is supplementary, not the sole indicator.

```tsx
// ✅ Correct — color + text
<span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
  Applied
</span>

// ❌ Wrong — color-only dot with no label
<span className="w-3 h-3 rounded-full bg-blue-500" title="Applied" />
```

---

## Dialogs and Modals

All dialogs use shadcn/ui `Dialog`, which is built on Radix UI. Radix handles:
- Focus trap (keyboard focus stays inside the dialog when open)
- `aria-modal="true"` attribute
- `role="dialog"` attribute
- Return focus to trigger element on close

**Developer responsibility:** Always provide a visible dialog title:

```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Delete Application</DialogTitle>
      <DialogDescription>
        Are you sure you want to delete the application for{" "}
        <strong>{companyName}</strong>? This action cannot be undone.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline" onClick={() => setOpen(false)}>
        Cancel
      </Button>
      <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
        {isPending ? "Deleting…" : "Delete"}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

Never use `DialogTitle` as visually hidden — keep it visible. It is both a visual heading and the accessible name for the dialog.

---

## Keyboard Navigation

### Tab Order

All interactive elements must be reachable via `Tab` key in a logical order:
1. Top navigation
2. Sidebar navigation links
3. Main content area
4. Form fields (top to bottom)
5. Action buttons

Do NOT use `tabIndex` values greater than 0. Use `tabIndex={0}` only to make a non-interactive element focusable when absolutely necessary.

### Button vs Link

- Use `<Button>` (renders `<button>`) for actions that trigger mutations or state changes.
- Use `<Button asChild>` with `<Link>` inside for navigation actions:

```tsx
// Navigation — use Link inside Button
<Button asChild variant="outline">
  <Link href="/dashboard/applications">Back to Applications</Link>
</Button>

// Action — use Button
<Button onClick={handleDelete} variant="destructive">
  Delete
</Button>
```

### Skip Link

Add a skip-to-main-content link as the first focusable element in the layout:

```tsx
// app/(dashboard)/layout.tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-blue-600 focus:rounded focus:shadow-lg"
>
  Skip to main content
</a>
```

And on the main content area:

```tsx
<main id="main-content" className="flex-1 overflow-y-auto p-4 md:p-8">
  {children}
</main>
```

---

## Loading States

When async operations are in progress, communicate state to assistive technologies:

```tsx
// Button loading state
<Button disabled={isPending} aria-busy={isPending}>
  {isPending ? (
    <>
      <span className="sr-only">Saving, please wait</span>
      <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" />
      Saving…
    </>
  ) : (
    "Save Application"
  )}
</Button>
```

For AI analysis loading:

```tsx
<div aria-live="polite" aria-atomic="true">
  {loading && <p className="text-sm text-gray-500">Analyzing your job description…</p>}
  {error && <p className="text-sm text-red-500" role="alert">{error}</p>}
</div>
```

Use `aria-live="polite"` for non-critical status updates. Use `aria-live="assertive"` (or `role="alert"`) only for errors.

---

## Charts Accessibility

Recharts `PieChart` renders SVG, which is not inherently accessible to screen readers.

Add a visually hidden data table alongside the chart:

```tsx
<div>
  {/* Visual chart for sighted users */}
  <PieChart width={300} height={300} aria-hidden="true">
    {/* chart content */}
  </PieChart>

  {/* Screen reader alternative */}
  <table className="sr-only">
    <caption>Application status distribution</caption>
    <thead>
      <tr>
        <th scope="col">Status</th>
        <th scope="col">Count</th>
      </tr>
    </thead>
    <tbody>
      {data.map((item) => (
        <tr key={item.status}>
          <td>{statusConfig[item.status].label}</td>
          <td>{item._count.status}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

---

## Images and Icons

### Profile Images

```tsx
<Image
  src={user.image ?? "/default-avatar.png"}
  alt={user.name ? `${user.name}'s profile picture` : "User profile picture"}
  width={32}
  height={32}
  className="rounded-full"
/>
```

### Decorative Icons

Icons used purely for decoration (alongside visible text) should be hidden from assistive technologies:

```tsx
// ✅ Icon is decorative — label comes from button text
<Button>
  <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
  New Application
</Button>

// ✅ Icon-only button — must have accessible label
<Button variant="ghost" aria-label="Delete application">
  <Trash2 className="h-4 w-4" aria-hidden="true" />
</Button>
```

---

## Color Contrast

Tailwind's default palette at these pairings meets WCAG AA (4.5:1 for normal text):

| Foreground | Background | Contrast |
|---|---|---|
| `text-gray-900` | `bg-white` | ~21:1 ✅ |
| `text-gray-700` | `bg-white` | ~9.7:1 ✅ |
| `text-gray-500` | `bg-white` | ~5.9:1 ✅ |
| `text-blue-700` | `bg-blue-100` | ~5.4:1 ✅ |
| `text-red-700` | `bg-red-100` | ~5.8:1 ✅ |
| `text-green-700` | `bg-green-100` | ~5.3:1 ✅ |
| `text-white` | `bg-blue-600` | ~5.9:1 ✅ |
| `text-white` | `bg-red-600` | ~5.1:1 ✅ |

Do not use `text-gray-400` on `bg-white` for meaningful text — it falls below 4.5:1.

---

## Screen Reader Only Utility

The `sr-only` Tailwind class visually hides content while keeping it accessible:

```tsx
// Use for content that supplements visual design but adds context for screen readers
<span className="sr-only">Current page:</span>
<span aria-current="page">Dashboard</span>
```

---

## Accordion Accessibility (AI Analysis Panel)

shadcn/ui `Accordion` is built on Radix UI and handles:
- `role="region"` on content panels
- `aria-expanded` on trigger buttons
- Keyboard navigation (Enter/Space to open, arrow keys to navigate)

No additional ARIA attributes needed beyond what Radix provides.

---

## Accessibility Testing Checklist

Before deployment, manually verify:

- [ ] Tab through the entire application — no focus traps outside dialogs
- [ ] All form fields announced correctly by VoiceOver (macOS) or NVDA (Windows)
- [ ] Validation errors are announced when form is submitted with errors
- [ ] Dialogs trap focus and return focus on close
- [ ] Delete dialog reads title and description
- [ ] Status badges read their text label (not just visible)
- [ ] AI loading state announced via `aria-live`
- [ ] Skip link appears on first Tab press from top of page
- [ ] Chart data table readable by screen reader
- [ ] All icon-only buttons have `aria-label`
