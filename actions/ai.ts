"use server"

import { prisma } from "@/lib/prisma"
import { getOpenAI, AI_MODEL, AI_PROMPTS } from "@/lib/openai"
import { buildRuleBasedAnalysis, parseAIResponse, type Analysis } from "@/lib/ai/analysis"
import { generateWithProvider, PROVIDERS, type ProviderId } from "@/lib/ai/providers"
import { decryptSecret } from "@/lib/crypto"
import { getSessionUser } from "@/lib/session-user"
import { revalidatePath } from "next/cache"
import type { ActionResult } from "@/types/actions"
import type { AIAnalysis } from "@prisma/client"

/**
 * AI analysis with a fallback chain:
 *   1. the user's own provider keys, in the order they chose (Gemini / GPT / Claude)
 *   2. the server's OpenAI key, if the site owner configured one
 *   3. the offline rule-based analysis, which always works
 * A provider that just failed is skipped for a minute (per user), so nobody
 * waits for the same timeout twice.
 */
const COOLDOWN_MS = 60_000
const cooldowns = new Map<string, number>()
const coolingDown = (key: string) => (cooldowns.get(key) ?? 0) > Date.now()
const coolDown = (key: string) => cooldowns.set(key, Date.now() + COOLDOWN_MS)

type Produced = { analysis: Analysis; source: string; model: string | null; tokens: number | null }
type AnalysisResult = AIAnalysis & { degradedReason?: string }

async function tryServerKey(company: string, role: string, jd: string): Promise<Produced> {
  const client = getOpenAI()
  if (!client) throw new Error("No server key configured")
  const response = await client.chat.completions.create({
    model: AI_MODEL,
    messages: [
      { role: "system", content: "You are a helpful career assistant that only responds in JSON." },
      { role: "user", content: AI_PROMPTS.ANALYZE_JD(company, role, jd) },
    ],
    response_format: { type: "json_object" },
  })
  return {
    analysis: parseAIResponse(response.choices[0]?.message?.content),
    source: "AI",
    model: AI_MODEL,
    tokens: response.usage?.total_tokens ?? null,
  }
}

export async function analyzeJobDescription(applicationId: string): Promise<ActionResult<AnalysisResult>> {
  const user = await getSessionUser()
  if (!user) return { success: false, error: "Unauthorized" }

  const application = await prisma.application.findFirst({ where: { id: applicationId, userId: user.id } })
  if (!application || !application.jobDescription) {
    return { success: false, error: "Add a job description to this application first." }
  }

  const { companyName, roleTitle, jobDescription } = application
  const prompt = AI_PROMPTS.ANALYZE_JD(companyName, roleTitle, jobDescription)
  const failures: string[] = []
  let produced: Produced | null = null

  // The demo account never calls a paid AI provider.
  if (!user.isDemo) {
    const keys = await prisma.aIProviderKey.findMany({ where: { userId: user.id }, orderBy: { priority: "asc" } })

    for (const key of keys) {
      const label = PROVIDERS[key.provider as ProviderId].label
      const cooldownKey = `${user.id}:${key.provider}`
      if (coolingDown(cooldownKey)) {
        failures.push(`${label}: skipped after a recent failure`)
        continue
      }
      try {
        const result = await generateWithProvider(key.provider as ProviderId, decryptSecret(key.encryptedKey), key.model, prompt)
        produced = { ...result, source: key.provider, model: key.model }
        await prisma.aIProviderKey.update({ where: { id: key.id }, data: { lastStatus: "Working", lastTestedAt: new Date() } })
        break
      } catch (error: any) {
        coolDown(cooldownKey)
        const message = error?.message ?? "The provider request failed."
        failures.push(`${label}: ${message}`)
        await prisma.aIProviderKey
          .update({ where: { id: key.id }, data: { lastStatus: message.slice(0, 120), lastTestedAt: new Date() } })
          .catch(() => {})
      }
    }

    if (!produced && !coolingDown("server")) {
      try {
        produced = await tryServerKey(companyName, roleTitle, jobDescription)
      } catch (error: any) {
        if (getOpenAI()) {
          coolDown("server")
          console.error("Server AI key failed:", { message: error?.message, status: error?.status })
          failures.push("Built-in AI: unavailable")
        }
      }
    }
  }

  let degradedReason: string | undefined
  if (!produced) {
    degradedReason = user.isDemo
      ? "The demo account uses the offline analysis."
      : failures.length
        ? `AI unavailable (${failures.join("; ")}).`
        : "No AI provider is set up. Add your own key in Settings."
    produced = {
      analysis: buildRuleBasedAnalysis({ roleTitle, companyName, jobDescription, userSkills: user.skills }),
      source: "RULES",
      model: null,
      tokens: null,
    }
  }

  try {
    const data = { ...produced.analysis, source: produced.source, model: produced.model, tokensUsed: produced.tokens }
    const saved = await prisma.aIAnalysis.upsert({
      where: { applicationId },
      update: { ...data, updatedAt: new Date() },
      create: { ...data, applicationId },
    })
    revalidatePath(`/dashboard/applications/${applicationId}`)
    return { success: true, data: { ...saved, degradedReason } }
  } catch (error) {
    console.error("Saving analysis failed:", error)
    return { success: false, error: "Could not save the analysis. Please try again." }
  }
}
