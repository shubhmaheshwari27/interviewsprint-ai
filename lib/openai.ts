import OpenAI from "openai"

/**
 * The OpenAI client is created lazily and only when a key is configured.
 * Before this, `new OpenAI()` ran at import time and threw when the key was
 * missing, which could take down every page that imported it. Every caller
 * must now handle `getOpenAI()` returning null.
 */
let client: OpenAI | null = null

export const AI_TIMEOUT_MS = 20_000

export function isAIConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim())
}

export function getOpenAI(): OpenAI | null {
  if (!isAIConfigured()) return null
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: AI_TIMEOUT_MS,
      maxRetries: 1,
    })
  }
  return client
}

export const AI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini"

export const AI_PROMPTS = {
  ANALYZE_JD: (company: string, role: string, jd: string) => `
    You are an expert career coach and technical recruiter.
    Analyze the following job description for the role of ${role} at ${company}.

    Job Description:
    ${jd.slice(0, 8000)}

    Output exactly in this JSON format. Do not include any other text, markdown backticks, or explanations.
    {
      "interviewQuestions": [
        { "category": "Technical", "question": "..." },
        { "category": "Behavioral", "question": "..." }
      ],
      "skillGaps": [
        { "skill": "...", "importance": "High/Medium/Low", "reason": "..." }
      ],
      "resumeTips": [
        "Tip 1",
        "Tip 2"
      ],
      "preparationRoadmap": [
        { "week": 1, "focus": "...", "resources": ["Resource 1", "Resource 2"] }
      ]
    }
  `,
}
