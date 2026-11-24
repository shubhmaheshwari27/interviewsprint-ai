import { describe, expect, it } from "vitest"
import { AnalysisSchema, buildRuleBasedAnalysis, parseAIResponse } from "@/lib/ai/analysis"
import { detectSkills } from "@/lib/skills"

const JD =
  "We need a React.js developer who can integrate REST APIs from our Java Spring Boot backend. SQL and Git required."

describe("detectSkills", () => {
  it("finds canonical skills and does not confuse Java with JavaScript or React with React Native", () => {
    expect(detectSkills(JD)).toEqual(["Java", "React", "SQL", "Spring Boot"])
    expect(detectSkills("JavaScript and React Native")).toEqual(["JavaScript", "React Native"])
  })
})

describe("buildRuleBasedAnalysis (offline fallback)", () => {
  it("produces a valid analysis with gaps based on the user's skills", () => {
    const a = buildRuleBasedAnalysis({ roleTitle: "React Developer", companyName: "Acme", jobDescription: JD, userSkills: ["React", "Java", "SQL"] })
    expect(() => AnalysisSchema.parse(a)).not.toThrow()
    expect(a.skillGaps.map((g) => g.skill)).toEqual(["Spring Boot"])
    expect(a.interviewQuestions.some((q) => q.category.includes("Spring Boot"))).toBe(true)
    expect(a.preparationRoadmap[0].focus).toContain("Spring Boot")
  })

  it("still works with no user skills and an empty job description", () => {
    const a = buildRuleBasedAnalysis({ roleTitle: "Engineer", companyName: "Acme", jobDescription: "", userSkills: [] })
    expect(a.interviewQuestions.length).toBeGreaterThan(0)
    expect(a.preparationRoadmap.length).toBeGreaterThan(0)
  })
})

describe("parseAIResponse", () => {
  it("rejects empty, non-JSON and wrongly shaped responses", () => {
    expect(() => parseAIResponse("")).toThrow()
    expect(() => parseAIResponse("not json")).toThrow()
    expect(() => parseAIResponse(JSON.stringify({ interviewQuestions: [] }))).toThrow()
  })

  it("accepts a valid response and normalises odd importance values", () => {
    const parsed = parseAIResponse(
      JSON.stringify({
        interviewQuestions: [{ category: "Technical", question: "What is a closure?" }],
        skillGaps: [{ skill: "Docker", importance: "very high", reason: "Listed" }],
        resumeTips: ["Quantify impact"],
        preparationRoadmap: [{ week: "1", focus: "Docker basics", resources: [] }],
      })
    )
    expect(parsed.skillGaps[0].importance).toBe("Medium")
    expect(parsed.preparationRoadmap[0].week).toBe(1)
  })
})
