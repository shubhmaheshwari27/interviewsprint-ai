import { z } from "zod"
import { detectSkills } from "@/lib/skills"

/** Shape every JD analysis must have, whether it came from the AI or the offline rules. */
export const AnalysisSchema = z.object({
  interviewQuestions: z
    .array(z.object({ category: z.string().min(1), question: z.string().min(1) }))
    .min(1),
  skillGaps: z.array(
    z.object({
      skill: z.string().min(1),
      importance: z.enum(["High", "Medium", "Low"]).catch("Medium"),
      reason: z.string().default(""),
    })
  ),
  resumeTips: z.array(z.string().min(1)),
  preparationRoadmap: z.array(
    z.object({
      week: z.coerce.number().int().min(1),
      focus: z.string().min(1),
      resources: z.array(z.string()).default([]),
    })
  ),
})

export type Analysis = z.infer<typeof AnalysisSchema>

/**
 * The same shape without coercion/catch/defaults, so it converts cleanly to a
 * JSON Schema for providers that support structured outputs (Claude). Their
 * answer is still validated with AnalysisSchema afterwards.
 */
export const AnalysisJsonShape = z.object({
  interviewQuestions: z.array(z.object({ category: z.string(), question: z.string() })),
  skillGaps: z.array(z.object({ skill: z.string(), importance: z.enum(["High", "Medium", "Low"]), reason: z.string() })),
  resumeTips: z.array(z.string()),
  preparationRoadmap: z.array(z.object({ week: z.number().int(), focus: z.string(), resources: z.array(z.string()) })),
})

/** Parse and validate an AI response. Throws if it is not usable. */
export function parseAIResponse(text: string | null | undefined): Analysis {
  if (!text) throw new Error("Empty AI response")
  return AnalysisSchema.parse(JSON.parse(text))
}

const QUESTION_BANK: Record<string, string[]> = {
  React: [
    "How does React decide when to re-render a component, and how would you prevent unnecessary renders?",
    "Explain the difference between useEffect, useMemo and useCallback with an example from your work.",
  ],
  "Next.js": ["When would you use a Server Component vs a Client Component in the Next.js App Router?"],
  "Node.js": [
    "How does the Node.js event loop handle many concurrent requests on a single thread?",
    "How would you structure error handling and validation in a Node.js REST API?",
  ],
  TypeScript: ["What problems does TypeScript catch for you, and how do you type an API response safely?"],
  JavaScript: ["Explain closures and the 'this' keyword in JavaScript with a practical example."],
  Java: [
    "Explain the difference between an interface and an abstract class in Java.",
    "How do HashMap and ConcurrentHashMap differ, and when would you use each?",
  ],
  "Spring Boot": [
    "How does dependency injection work in Spring Boot?",
    "Walk through how you would build a REST controller with validation and exception handling in Spring Boot.",
  ],
  SQL: [
    "How would you find and fix a slow SQL query?",
    "Explain the difference between INNER JOIN, LEFT JOIN and a subquery, and when indexes help.",
  ],
  MongoDB: ["When would you choose MongoDB over a relational database, and how do you model relationships in it?"],
  AWS: ["Which AWS services have you used, and how would you deploy a web app with them?"],
  Docker: ["What goes into a production Dockerfile for a Node.js or Java service?"],
  Microservices: ["How do services communicate in a microservices architecture, and how do you handle one service being down?"],
  "CI/CD": ["Describe a CI/CD pipeline you have set up or would set up for this team."],
  Python: ["How do you structure a Python service and manage its dependencies?"],
  Redux: ["When is Redux worth it over React context, and how do you structure a store?"],
  GraphQL: ["What are the trade-offs between GraphQL and REST?"],
}

const GENERIC_QUESTIONS = [
  { category: "Behavioral", question: "Tell me about a feature you built end to end. What would you do differently now?" },
  { category: "Behavioral", question: "Describe a production bug you investigated and how you found the root cause." },
  { category: "Behavioral", question: "Why are you interested in this role and this company?" },
]

/**
 * Deterministic fallback used when the AI provider is not configured, times
 * out or returns something unusable. It works from the job description and
 * the user's own skills, so the feature degrades instead of failing.
 */
export function buildRuleBasedAnalysis(input: {
  roleTitle: string
  companyName: string
  jobDescription: string
  userSkills: string[]
}): Analysis {
  const required = detectSkills(`${input.roleTitle}\n${input.jobDescription}`)
  const have = new Set(input.userSkills.map((s) => s.toLowerCase()))
  const missing = required.filter((s) => !have.has(s.toLowerCase()))
  const matched = required.filter((s) => have.has(s.toLowerCase()))

  const technical = required
    .flatMap((skill) => (QUESTION_BANK[skill] ?? []).map((question) => ({ category: `Technical · ${skill}`, question })))
    .slice(0, 8)

  const interviewQuestions = [
    ...technical,
    ...GENERIC_QUESTIONS,
    { category: "Role", question: `What do you know about ${input.companyName}, and how would you contribute as ${input.roleTitle}?` },
  ]

  const skillGaps = input.userSkills.length
    ? missing.map((skill, i) => ({
        skill,
        importance: (i < 2 ? "High" : "Medium") as "High" | "Medium",
        reason: `Mentioned in the job description but not in your profile skills.`,
      }))
    : required.map((skill) => ({
        skill,
        importance: "Medium" as const,
        reason: "Required by the job. Add your skills on the Profile page to see which ones are real gaps.",
      }))

  const resumeTips = [
    matched.length
      ? `Lead with the skills this job asks for that you already have: ${matched.join(", ")}.`
      : "Mirror the job description's key technologies in your skills section where they are true for you.",
    "Quantify impact in every bullet (%, time saved, users, requests handled).",
    `Use the exact role title "${input.roleTitle}" in your resume headline for this application.`,
    ...(missing.length ? [`If you have any exposure to ${missing.slice(0, 3).join(", ")}, add a project or bullet that shows it.`] : []),
  ]

  const focusAreas = (missing.length ? missing : required).slice(0, 3)
  const preparationRoadmap = [
    ...focusAreas.map((skill, i) => ({
      week: i + 1,
      focus: `${skill}: fundamentals and one small project`,
      resources: [`Official ${skill} documentation`, `Build a mini feature using ${skill}`],
    })),
    {
      week: focusAreas.length + 1,
      focus: "Mock interviews and revising your projects",
      resources: ["Practise the questions above out loud", "Revise your resume bullets with numbers"],
    },
  ]

  return AnalysisSchema.parse({ interviewQuestions, skillGaps, resumeTips, preparationRoadmap })
}
