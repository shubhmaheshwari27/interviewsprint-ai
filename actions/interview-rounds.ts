"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { ActionResult } from "@/types/actions"
import type { InterviewRound } from "@prisma/client"

import { InterviewRoundSchema } from "@/lib/schemas"

// ─── Actions ──────────────────────────────────────────────────────────────────

export async function createInterviewRound(
  applicationId: string,
  formData: FormData
): Promise<ActionResult<InterviewRound>> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Unauthorized" }

  const application = await prisma.application.findFirst({
    where: { id: applicationId, userId: session.user.id }
  })
  if (!application) return { success: false, error: "Application not found" }

  const parsed = InterviewRoundSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  try {
    const round = await prisma.interviewRound.create({
      data: { 
        ...parsed.data, 
        scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : undefined,
        applicationId 
      }
    })
    revalidatePath(`/dashboard/applications/${applicationId}`)
    return { success: true, data: round }
  } catch (error) {
    console.error("Create round error:", error)
    return { success: false, error: "Failed to add interview round." }
  }
}

export async function updateInterviewRound(
  roundId: string,
  applicationId: string,
  formData: FormData
): Promise<ActionResult<InterviewRound>> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Unauthorized" }

  const application = await prisma.application.findFirst({
    where: { id: applicationId, userId: session.user.id }
  })
  if (!application) return { success: false, error: "Application not found" }

  const UpdateSchema = InterviewRoundSchema.partial()
  const parsed = UpdateSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  try {
    // CRITICAL FIX: Only include fields actually present in the FormData
    // to prevent Zod's .default("") from overwriting existing values.
    const submittedKeys = new Set(formData.keys())
    const data: Record<string, unknown> = {}

    for (const key of submittedKeys) {
      if (key in parsed.data) {
        if (key === "scheduledAt") {
          const dateVal = (parsed.data as Record<string, unknown>)[key]
          if (dateVal) {
            data[key] = new Date(dateVal as string)
          }
        } else {
          data[key] = (parsed.data as Record<string, unknown>)[key]
        }
      }
    }

    const round = await prisma.interviewRound.update({
      where: { id: roundId, applicationId },
      data
    })
    revalidatePath(`/dashboard/applications/${applicationId}`)
    return { success: true, data: round }
  } catch (error) {
    console.error("Update round error:", error)
    return { success: false, error: "Failed to update interview round." }
  }
}

export async function deleteInterviewRound(
  roundId: string,
  applicationId: string
): Promise<ActionResult<void>> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Unauthorized" }

  const application = await prisma.application.findFirst({
    where: { id: applicationId, userId: session.user.id }
  })
  if (!application) return { success: false, error: "Application not found" }

  try {
    await prisma.interviewRound.delete({
      where: { id: roundId, applicationId }
    })
    revalidatePath(`/dashboard/applications/${applicationId}`)
    return { success: true }
  } catch (error) {
    console.error("Delete round error:", error)
    return { success: false, error: "Failed to delete interview round." }
  }
}
