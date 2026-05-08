"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { ActionResult } from "@/types/actions"
import type { Application } from "@prisma/client"

import { CreateApplicationSchema, ApplicationStatusEnum } from "@/lib/schemas"

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
      data: { 
        ...parsed.data, 
        applicationDate: new Date(parsed.data.applicationDate),
        userId: session.user.id 
      },
    })
    revalidatePath("/dashboard/applications")
    return { success: true, data: application }
  } catch (error) {
    console.error("Create application error:", error)
    return { success: false, error: "Failed to create application." }
  }
}

// ─── Dedicated Status Update (partial, safe) ─────────────────────────────────

export async function updateApplicationStatus(
  id: string,
  status: string
): Promise<ActionResult<Application>> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Unauthorized" }

  const parsed = ApplicationStatusEnum.safeParse(status)
  if (!parsed.success) {
    return { success: false, error: "Invalid status value." }
  }

  try {
    const result = await prisma.application.updateMany({
      where: { id, userId: session.user.id },
      data: { status: parsed.data },
    })

    if (result.count === 0) {
      return { success: false, error: "Application not found." }
    }

    const updated = await prisma.application.findUniqueOrThrow({ where: { id } })
    revalidatePath(`/dashboard/applications/${id}`)
    revalidatePath("/dashboard/applications")
    return { success: true, data: updated }
  } catch (error) {
    console.error("Update application status error:", error)
    return { success: false, error: "Failed to update status." }
  }
}

// ─── Full Application Update (form-based, safe partial) ──────────────────────

export async function updateApplication(
  id: string,
  formData: FormData
): Promise<ActionResult<Application>> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Unauthorized" }

  const UpdateSchema = CreateApplicationSchema.partial()
  const raw = Object.fromEntries(formData)
  const parsed = UpdateSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  try {
    // CRITICAL FIX: Only include fields that were actually submitted in the FormData.
    // This prevents Zod's .default("") from overwriting existing DB values with empty strings
    // when a field was not included in the form submission.
    const submittedKeys = new Set(formData.keys())
    const data: Record<string, unknown> = {}

    for (const key of submittedKeys) {
      if (key in parsed.data) {
        if (key === "applicationDate") {
          const dateVal = (parsed.data as Record<string, unknown>)[key]
          if (dateVal) {
            data[key] = new Date(dateVal as string)
          }
        } else {
          data[key] = (parsed.data as Record<string, unknown>)[key]
        }
      }
    }

    if (Object.keys(data).length === 0) {
      return { success: false, error: "No fields to update." }
    }

    const result = await prisma.application.updateMany({
      where: { id, userId: session.user.id },
      data,
    })

    if (result.count === 0) {
      return { success: false, error: "Application not found." }
    }

    const updated = await prisma.application.findUniqueOrThrow({ where: { id } })
    revalidatePath(`/dashboard/applications/${id}`)
    revalidatePath("/dashboard/applications")
    return { success: true, data: updated }
  } catch (error) {
    console.error("Update application error:", error)
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
  } catch (error) {
    console.error("Delete application error:", error)
    return { success: false, error: "Failed to delete application." }
  }
}
