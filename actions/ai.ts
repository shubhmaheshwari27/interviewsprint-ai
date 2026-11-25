"use server"

import { revalidatePath } from "next/cache"
import { getSessionUser } from "@/lib/session-user"
import { runAnalysis, type AnalysisResult } from "@/lib/ai/run"
import type { ActionResult } from "@/types/actions"

export async function analyzeJobDescription(applicationId: string): Promise<ActionResult<AnalysisResult>> {
  const user = await getSessionUser()
  if (!user) return { success: false, error: "Unauthorized" }
  const result = await runAnalysis(user, applicationId)
  if (!result.ok) return { success: false, error: result.error }
  revalidatePath(`/dashboard/applications/${applicationId}`)
  return { success: true, data: result.data }
}
