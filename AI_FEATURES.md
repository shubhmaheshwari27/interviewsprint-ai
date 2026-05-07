# AI_FEATURES.md

## Purpose

Defines the complete AI feature implementation for InterviewSprint AI. This includes the Gemini API integration, prompt engineering, response parsing, rate limiting, and UI behavior.

---

## AI Feature Overview

AI features are an optional add-on. The user explicitly triggers analysis on a per-application basis. There are no background jobs or automated AI calls.

**Model:** `gemini-1.5-flash` (fast, cheap, sufficient for structured generation)

**Library:** `@google/generative-ai`

**Trigger:** User clicks "Analyze with AI" on an application detail page.

**Input:** The `jobDescription` field of the application.

**Output:** Structured JSON stored in the `AIAnalysis` table.

---

## Gemini Client Setup

File: `lib/gemini.ts`

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai"

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not set")
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export const geminiModel = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig: {
    responseMimeType: "application/json",
    temperature: 0.7,
    maxOutputTokens: 2048,
  },
})
```

Setting `responseMimeType: "application/json"` instructs Gemini to always return valid JSON, eliminating markdown fences in the output.

---

## AI Analysis Prompt

File: `lib/ai-prompt.ts`

```typescript
export function buildAnalysisPrompt(jobDescription: string): string {
  return `
You are an expert technical interview coach. Analyze the following job description and return a JSON object with exactly this structure:

{
  "interviewQuestions": [
    { "category": "Technical" | "Behavioral" | "System Design", "question": string }
  ],
  "skillGaps": [
    { "skill": string, "importance": "High" | "Medium" | "Low", "reason": string }
  ],
  "resumeTips": [string],
  "preparationRoadmap": [
    { "week": number, "focus": string, "resources": [string] }
  ]
}

Rules:
- Generate exactly 8 interview questions (mix of technical, behavioral, and system design based on the JD).
- Identify 3-6 key skill gaps a typical candidate might have for this role.
- Provide 4-5 resume improvement tips specific to this job description.
- Create a 3-week preparation roadmap with specific, actionable focus areas.
- Resources should be real, specific learning resources (books, courses, documentation).
- Do not add any text outside the JSON object.
- Do not use markdown formatting.

Job Description:
---
${jobDescription.slice(0, 8000)}
---
`.trim()
}
```

The job description is truncated to 8,000 characters to avoid exceeding token limits.

---

## AI Route Handler

File: `app/api/ai/analyze/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { geminiModel } from "@/lib/gemini"
import { buildAnalysisPrompt } from "@/lib/ai-prompt"
import { AIAnalysisResponseSchema } from "@/lib/ai-validation"
import { rateLimiter } from "@/lib/rate-limiter"
import { z } from "zod"

const RequestSchema = z.object({
  applicationId: z.string().min(1),
})

export async function POST(req: NextRequest) {
  // 1. Authenticate
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // 2. Rate limit
  const { allowed } = rateLimiter.check(session.user.id)
  if (!allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again in 60 seconds." },
      { status: 429 }
    )
  }

  // 3. Validate body
  const body = await req.json().catch(() => null)
  const parsed = RequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }

  // 4. Fetch application (ownership check)
  const application = await prisma.application.findFirst({
    where: {
      id: parsed.data.applicationId,
      userId: session.user.id,
    },
  })

  if (!application) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 })
  }

  if (!application.jobDescription || application.jobDescription.trim().length < 50) {
    return NextResponse.json(
      { error: "Job description is required for AI analysis (minimum 50 characters)." },
      { status: 400 }
    )
  }

  // 5. Generate analysis
  try {
    const prompt = buildAnalysisPrompt(application.jobDescription)
    const result = await geminiModel.generateContent(prompt)
    const rawText = result.response.text()

    const analysisData = JSON.parse(rawText)
    const validated = AIAnalysisResponseSchema.parse(analysisData)

    // 6. Upsert to database
    const aiAnalysis = await prisma.aIAnalysis.upsert({
      where: { applicationId: application.id },
      update: {
        interviewQuestions: validated.interviewQuestions,
        skillGaps: validated.skillGaps,
        resumeTips: validated.resumeTips,
        preparationRoadmap: validated.preparationRoadmap,
        updatedAt: new Date(),
      },
      create: {
        applicationId: application.id,
        interviewQuestions: validated.interviewQuestions,
        skillGaps: validated.skillGaps,
        resumeTips: validated.resumeTips,
        preparationRoadmap: validated.preparationRoadmap,
      },
    })

    return NextResponse.json({ success: true, data: validated })
  } catch (error) {
    console.error("[AI Analysis Error]", error)
    return NextResponse.json(
      { error: "AI analysis failed. Please try again." },
      { status: 500 }
    )
  }
}
```

---

## AI Response Validation Schema

File: `lib/ai-validation.ts`

```typescript
import { z } from "zod"

export const AIAnalysisResponseSchema = z.object({
  interviewQuestions: z
    .array(
      z.object({
        category: z.enum(["Technical", "Behavioral", "System Design"]),
        question: z.string().min(10),
      })
    )
    .min(1)
    .max(20),
  skillGaps: z
    .array(
      z.object({
        skill: z.string().min(1),
        importance: z.enum(["High", "Medium", "Low"]),
        reason: z.string().min(1),
      })
    )
    .min(1)
    .max(10),
  resumeTips: z.array(z.string().min(10)).min(1).max(10),
  preparationRoadmap: z
    .array(
      z.object({
        week: z.number().int().positive(),
        focus: z.string().min(1),
        resources: z.array(z.string()).min(1),
      })
    )
    .min(1)
    .max(8),
})

export type AIAnalysisResponse = z.infer<typeof AIAnalysisResponseSchema>
```

---

## Rate Limiter

File: `lib/rate-limiter.ts`

A simple in-memory token bucket rate limiter. For a single-instance Vercel deployment, this is sufficient for demo purposes.

```typescript
interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

const LIMIT = 5 // requests
const WINDOW_MS = 60 * 1000 // 60 seconds

export const rateLimiter = {
  check(userId: string): { allowed: boolean; remaining: number } {
    const now = Date.now()
    const entry = store.get(userId)

    if (!entry || now > entry.resetAt) {
      store.set(userId, { count: 1, resetAt: now + WINDOW_MS })
      return { allowed: true, remaining: LIMIT - 1 }
    }

    if (entry.count >= LIMIT) {
      return { allowed: false, remaining: 0 }
    }

    entry.count += 1
    return { allowed: true, remaining: LIMIT - entry.count }
  },
}
```

**Limitation:** This in-memory limiter does not persist across serverless function invocations. It is appropriate for demo/assignment purposes. For production, replace with a Redis-backed counter (e.g., Upstash Redis with `@upstash/ratelimit`).

---

## AI Analysis UI

File: `components/applications/AIAnalysisPanel.tsx` — Client Component

**States:**

1. **No analysis exists + job description present:** Show "Analyze with AI" button.
2. **No analysis exists + no job description:** Show disabled button with tooltip "Add a job description first."
3. **Loading:** Show spinner + "Analyzing your job description…" text. Button disabled.
4. **Analysis exists:** Show results accordion with 4 sections.
5. **Error:** Show error alert. Show "Try Again" button.

**Behavior on click:**

```typescript
const [loading, setLoading] = useState(false)
const [error, setError] = useState<string | null>(null)
const [analysis, setAnalysis] = useState<AIAnalysisResponse | null>(initialAnalysis)

async function handleAnalyze() {
  setLoading(true)
  setError(null)

  const res = await fetch("/api/ai/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ applicationId }),
  })

  const data = await res.json()

  if (!res.ok) {
    setError(data.error ?? "Analysis failed.")
  } else {
    setAnalysis(data.data)
  }

  setLoading(false)
}
```

**Results display structure:**

```
AIAnalysisPanel
├── Section: Interview Questions (accordion)
│   └── Grouped by category (Technical, Behavioral, System Design)
├── Section: Skill Gaps (accordion)
│   └── List with importance badge (High=red, Medium=yellow, Low=green)
├── Section: Resume Tips (accordion)
│   └── Ordered list
└── Section: Preparation Roadmap (accordion)
    └── Week-by-week timeline with resources
```
