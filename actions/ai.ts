"use server"

import { prisma } from "@/lib/prisma"
import { getOpenAI, AI_MODEL, AI_PROMPTS } from "@/lib/openai"
import { buildRuleBasedAnalysis, parseAIResponse, type Analysis } from "@/lib/ai/analysis"
import { getSessionUser } from "@/lib/session-user"
import { revalidatePath } from "next/cache"
import type { ActionResult } from "@/types/actions"
import type { AIAnalysis } from "@prisma/client"

/**
 * Simple circuit breaker: after the AI provider fails, skip it for a minute and
 * serve the offline analysis straight away instead of making every user wait
 * for another timeout. Lives per server instance, which is enough here.
 */
const COOLDOWN_MS = 60_000
let aiUnavailableUntil = 0

type AnalysisResult = AIAnalysis & { degradedReason?: string }

async function generateWithAI(company: string, role: string, jd: string): Promise<Analysis> {
  const client = getOpenAI()
  if (!client) throw new AIUnavailable("AI is not configured on this server.")
  if (Date.now() < aiUnavailableUntil) throw new AIUnavailable("AI was unavailable a moment ago.")

  try {
    const response = await client.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: "system", content: "You are a helpful career assistant that only responds in JSON." },
        { role: "user", content: AI_PROMPTS.ANALYZE_JD(company, role, jd) },
      ],
      response_format: { type: "json_object" },
    })
    return parseAIResponse(response.choices[0]?.message?.content)
  } catch (error: any) {
    aiUnavailableUntil = Date.now() + COOLDOWN_MS
    console.error("AI analysis failed, using offline analysis:", {
      message: error?.message,
      status: error?.status,
    })
    throw new AIUnavailable(friendlyReason(error))
  }
}

class AIUnavailable extends Error {}

function friendlyReason(error: any): string {
  const message = String(error?.message ?? "").toLowerCase()
  if (error?.status === 429 || message.includes("quota") || message.includes("rate limit")) return "The AI service is busy."
  if (error?.status === 401 || error?.status === 403) return "The AI service rejected the request."
  if (message.includes("timeout") || message.includes("timed out")) return "The AI service took too long to answer."
  if (error?.name === "ZodError" || error instanceof SyntaxError) return "The AI returned an unusable answer."
  return "The AI service is unavailable."
}

export async function analyzeJobDescription(applicationId: string): Promise<ActionResult<AnalysisResult>> {
  const user = await getSessionUser()
  if (!user) return { success: false, error: "Unauthorized" }

  const application = await prisma.application.findFirst({
    where: { id: applicationId, userId: user.id },
  })
  if (!application || !application.jobDescription) {
    return { success: false, error: "Add a job description to this application first." }
  }

  let analysis: Analysis
  let source: "AI" | "RULES" = "AI"
  let degradedReason: string | undefined

  try {
    // The demo account never calls the paid AI provider.
    if (user.isDemo) throw new AIUnavailable("The demo account uses the offline analysis.")
    analysis = await generateWithAI(application.companyName, application.roleTitle, application.jobDescription)
  } catch (error) {
    if (!(error instanceof AIUnavailable)) console.error("Unexpected AI error:", error)
    source = "RULES"
    degradedReason = error instanceof AIUnavailable ? error.message : "The AI service is unavailable."
    analysis = buildRuleBasedAnalysis({
      roleTitle: application.roleTitle,
      companyName: application.companyName,
      jobDescription: application.jobDescription,
      userSkills: user.skills,
    })
  }

  try {
    const saved = await prisma.aIAnalysis.upsert({
      where: { applicationId },
      update: { ...analysis, source, updatedAt: new Date() },
      create: { ...analysis, source, applicationId },
    })
    revalidatePath(`/dashboard/applications/${applicationId}`)
    return { success: true, data: { ...saved, degradedReason } }
  } catch (error) {
    console.error("Saving analysis failed:", error)
    return { success: false, error: "Could not save the analysis. Please try again." }
  }
}
