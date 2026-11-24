import { describe, expect, it } from "vitest"
import { computeMarket } from "@/lib/market"

describe("computeMarket", () => {
  const signals = [
    { decision: "APPLIED" as const, blocker: "None (applied)", expBand: "1–2 yrs", skills: ["React", "Node.js"] },
    { decision: "SKIPPED" as const, blocker: "Skills", expBand: "1–2 yrs", skills: ["React", "Python"] },
    { decision: "SKIPPED" as const, blocker: "Skills", expBand: "0–1 yrs", skills: ["Python", "Django/FastAPI/Flask"] },
    { decision: "SKIPPED" as const, blocker: "Experience", expBand: "3–5 yrs", skills: ["React", "Redux"] },
  ]

  it("ranks skill demand and marks owned skills", () => {
    const m = computeMarket({ userSkills: ["react", "Node.js"], signals })
    expect(m.totalJobs).toBe(4)
    expect(m.applied).toBe(1)
    expect(m.skipped).toBe(3)
    expect(m.skillDemand[0]).toEqual({ skill: "React", jobs: 3, share: 75, have: true })
    expect(m.skillDemand.find((s) => s.skill === "Python")?.have).toBe(false)
  })

  it("puts the skill that was the only gap most often first in learnNext", () => {
    const m = computeMarket({ userSkills: ["React", "Node.js"], signals })
    // Python is the only gap in job 2; Redux is the only gap in job 4; Python also appears in job 3.
    expect(m.learnNext[0].skill).toBe("Python")
    expect(m.learnNext[0]).toMatchObject({ jobs: 2, skippedJobs: 2, onlyGapJobs: 1 })
  })

  it("counts blockers only for skipped jobs and orders experience bands", () => {
    const m = computeMarket({ userSkills: [], signals })
    expect(m.blockers).toEqual([
      { blocker: "Skills", jobs: 2 },
      { blocker: "Experience", jobs: 1 },
    ])
    expect(m.experienceBands.map((b) => b.band)).toEqual(["0–1 yrs", "1–2 yrs", "3–5 yrs"])
    expect(m.coverage).toBe(0)
  })
})
