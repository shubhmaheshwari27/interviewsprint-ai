# SERVER_ACTIONS_GUIDE.md

## Purpose

Defines how Server Actions are implemented, called, and handled in InterviewSprint AI. This guide covers the full pattern: definition, validation, error handling, revalidation, and client-side usage.

---

## Server Action Pattern

Every Server Action in this project follows this exact pattern:

```typescript
"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { ActionResult } from "@/types/actions"

// 1. Define Zod validation schema
const MySchema = z.object({ ... })

// 2. Export the action function
export async function myAction(
  // Parameters can be: FormData, plain values, or a mix
  id: string,
  formData: FormData
): Promise<ActionResult<ReturnType>> {

  // 3. Always authenticate first
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }
  const userId = session.user.id

  // 4. Parse and validate input
  const raw = Object.fromEntries(formData)
  const parsed = MySchema.safeParse(raw)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    }
  }

  // 5. Perform DB operation (always include userId in where clause)
  try {
    const result = await prisma.someModel.create({
      data: { ...parsed.data, userId },
    })

    // 6. Revalidate affected paths
    revalidatePath("/dashboard/applications")

    // 7. Return success
    return { success: true, data: result }
  } catch (error) {
    console.error("[myAction Error]", error)
    return { success: false, error: "Something went wrong. Please try again." }
  }
}
```

---

## Full `actions/applications.ts`

```typescript
"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import type { ActionResult } from "@/types/actions"
import type { Application } from "@prisma/client"

// ─── Schemas ──────────────────────────────────────────────────────────────────

const ApplicationStatusEnum = z.enum([
  "APPLIED", "SCREENING", "INTERVIEWING", "OFFER", "REJECTED", "WITHDRAWN",
])

const CreateApplicationSchema = z.object({
  companyName:     z.string().min(1, "Company name is required").max(100),
  roleTitle:       z.string().min(1, "Role title is required").max(100),
  jobDescription:  z.string().max(10000).optional().default(""),
  status:          ApplicationStatusEnum.default("APPLIED"),
  applicationDate: z.string().transform((v) => new Date(v)),
  techStack:       z.string().max(500).optional().default(""),
  notes:           z.string().max(5000).optional().default(""),
  salaryRange:     z.string().max(50).optional().default(""),
  interviewStage:  z.string().max(200).optional().default(""),
})

// Export schema for client-side use with react-hook-form
export type CreateApplicationInput = z.infer<typeof CreateApplicationSchema>

// ─── Actions ──────────────────────────────────────────────────────────────────

export async function createApplication(
  formData: FormData
): Promise<ActionResult<Application>> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Unauthorized" }

  const parsed = CreateApplicationSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  try {
    const application = await prisma.application.create({
      data: { ...parsed.data, userId: session.user.id },
    })
    revalidatePath("/dashboard/applications")
    return { success: true, data: application }
  } catch {
    return { success: false, error: "Failed to create application." }
  }
}

export async function updateApplication(
  id: string,
  formData: FormData
): Promise<ActionResult<Application>> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Unauthorized" }

  const UpdateSchema = CreateApplicationSchema.partial()
  const parsed = UpdateSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  try {
    const result = await prisma.application.updateMany({
      where: { id, userId: session.user.id },
      data: parsed.data,
    })

    if (result.count === 0) {
      return { success: false, error: "Application not found." }
    }

    const updated = await prisma.application.findUniqueOrThrow({ where: { id } })
    revalidatePath(`/dashboard/applications/${id}`)
    revalidatePath("/dashboard/applications")
    return { success: true, data: updated }
  } catch {
    return { success: false, error: "Failed to update application." }
  }
}

export async function deleteApplication(
  id: string
): Promise<ActionResult<void>> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Unauthorized" }

  try {
    const result = await prisma.application.deleteMany({
      where: { id, userId: session.user.id },
    })

    if (result.count === 0) {
      return { success: false, error: "Application not found." }
    }

    revalidatePath("/dashboard/applications")
    return { success: true }
  } catch {
    return { success: false, error: "Failed to delete application." }
  }
}
```

---

## Calling Server Actions from Client Components

### Pattern 1: With `useTransition` (recommended for async state)

```typescript
"use client"

import { useTransition, useState } from "react"
import { useRouter } from "next/navigation"
import { createApplication } from "@/actions/applications"

export function ApplicationForm() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createApplication(formData)
      if (result.success) {
        router.push("/dashboard/applications")
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <form action={handleSubmit}>
      {/* form fields */}
      <button disabled={isPending} type="submit">
        {isPending ? "Saving…" : "Save Application"}
      </button>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </form>
  )
}
```

### Pattern 2: With `react-hook-form` (for validated forms)

```typescript
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTransition } from "react"
import { CreateApplicationSchema } from "@/actions/applications"

export function ApplicationForm() {
  const [isPending, startTransition] = useTransition()

  const form = useForm({
    resolver: zodResolver(CreateApplicationSchema),
    defaultValues: { status: "APPLIED", applicationDate: new Date().toISOString().split("T")[0] },
  })

  function onSubmit(values: CreateApplicationInput) {
    const formData = new FormData()
    Object.entries(values).forEach(([k, v]) => {
      if (v !== undefined && v !== null) formData.append(k, String(v))
    })
    startTransition(async () => {
      const result = await createApplication(formData)
      // handle result
    })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* RHF fields */}
    </form>
  )
}
```

---

## Revalidation Strategy

| Action | Revalidated Paths |
|---|---|
| `createApplication` | `/dashboard/applications` |
| `updateApplication` | `/dashboard/applications`, `/dashboard/applications/[id]` |
| `deleteApplication` | `/dashboard/applications` |
| `createInterviewRound` | `/dashboard/applications/[id]` |
| `updateInterviewRound` | `/dashboard/applications/[id]` |
| `deleteInterviewRound` | `/dashboard/applications/[id]` |

`revalidatePath` triggers a re-fetch of the Server Component at that path on the next navigation or page refresh. It does not cause an immediate re-render.

---

## Error Propagation Contract

Server Actions NEVER throw errors to the client. All errors are caught and returned as `{ success: false, error: string }`.

The client is responsible for displaying the error message.

```typescript
// ✅ Correct: catch and return
try {
  await prisma.application.create(...)
  return { success: true, data: result }
} catch {
  return { success: false, error: "Failed to create application." }
}

// ❌ Wrong: throwing from a Server Action
throw new Error("DB error")  // This causes unhandled error in Next.js
```
