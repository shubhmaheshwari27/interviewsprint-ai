"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { ActionResult } from "@/types/actions"
import type { Application } from "@prisma/client"

import { CreateApplicationSchema } from "@/lib/schemas"

// ─── Actions ──────────────────────────────────────────────────────────────────

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
    const data = {
      ...parsed.data,
      applicationDate: parsed.data.applicationDate ? new Date(parsed.data.applicationDate) : undefined,
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
