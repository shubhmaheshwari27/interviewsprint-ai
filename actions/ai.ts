"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { openai, AI_PROMPTS } from "@/lib/openai"
import { revalidatePath } from "next/cache"
import type { ActionResult } from "@/types/actions"
import type { AIAnalysis } from "@prisma/client"

export async function analyzeJobDescription(
  applicationId: string
): Promise<ActionResult<AIAnalysis>> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Unauthorized" }

  const application = await prisma.application.findFirst({
    where: { id: applicationId, userId: session.user.id }
  })

  if (!application || !application.jobDescription) {
    return { success: false, error: "Application or Job Description not found." }
  }

  try {
    const prompt = AI_PROMPTS.ANALYZE_JD(
      application.companyName,
      application.roleTitle,
      application.jobDescription
    )

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: "You are a helpful career assistant that only responds in JSON." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
    })

    const responseText = response.choices[0].message.content
    if (!responseText) {
      throw new Error("No response from OpenAI")
    }

    console.log("Raw OpenAI Response:", responseText)
    const analysisData = JSON.parse(responseText)

    const analysis = await prisma.aIAnalysis.upsert({
      where: { applicationId },
      update: {
        ...analysisData,
        updatedAt: new Date(),
      },
      create: {
        ...analysisData,
        applicationId,
      },
    })

    revalidatePath(`/dashboard/applications/${applicationId}`)
    return { success: true, data: analysis }
  } catch (error: any) {
    // Keep detailed logs server-side
    console.error("AI Analysis internal error:", {
      message: error.message,
      stack: error.stack,
      status: error.status,
    })

    // Sanitize message for the frontend
    let userMessage = "AI analysis failed. Please try again."
    
    const errorMessage = error.message?.toLowerCase() || ""
    const status = error.status

    if (status === 429 || errorMessage.includes("quota") || errorMessage.includes("rate limit")) {
      userMessage = "AI service is temporarily busy. Please try again in a few moments."
    } else if (status === 401 || status === 403 || errorMessage.includes("api key") || errorMessage.includes("unauthorized")) {
      userMessage = "AI configuration issue detected."
    } else if (error instanceof SyntaxError || errorMessage.includes("parse") || errorMessage.includes("json")) {
      userMessage = "Unable to process AI response right now."
    }

    return { 
      success: false, 
      error: userMessage
    }
  }
}
