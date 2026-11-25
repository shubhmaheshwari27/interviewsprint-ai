/**
 * Market Gap analysis: from every job posting screened (applied or skipped)
 * with the skills it required, work out what the market asks for, what blocked
 * applications, and which missing skills would unlock the most jobs.
 * Pure function, mirrored by the Java analytics service.
 */

export type MarketInput = {
  userSkills: string[]
  signals: { decision: "APPLIED" | "SKIPPED"; blocker: string; expBand: string; skills: string[] }[]
}

export type SkillDemand = { skill: string; jobs: number; share: number; have: boolean }
export type LearnNext = { skill: string; jobs: number; skippedJobs: number; onlyGapJobs: number }

export type MarketSummary = {
  totalJobs: number
  applied: number
  skipped: number
  skillDemand: SkillDemand[] // top skills by number of jobs asking for them
  blockers: { blocker: string; jobs: number }[] // why skipped jobs were skipped
  experienceBands: { band: string; jobs: number }[]
  learnNext: LearnNext[] // missing skills ranked by how many jobs they would open up
  coverage: number // % of all skill mentions the user already has
}

const BAND_ORDER = ["0–1 yrs", "1–2 yrs", "2–3 yrs", "3–5 yrs", "5+ yrs", "Not stated"]

export function computeMarket({ userSkills, signals }: MarketInput): MarketSummary {
  const have = new Set(userSkills.map((s) => s.toLowerCase()))
  const owns = (skill: string) => have.has(skill.toLowerCase())

  const demand = new Map<string, number>()
  const learn = new Map<string, { jobs: number; skippedJobs: number; onlyGapJobs: number }>()
  const blockers = new Map<string, number>()
  const bands = new Map<string, number>()
  let mentions = 0
  let owned = 0

  for (const s of signals) {
    const skills = [...new Set(s.skills)]
    const missing = skills.filter((k) => !owns(k))
    for (const k of skills) {
      demand.set(k, (demand.get(k) ?? 0) + 1)
      mentions++
      if (owns(k)) owned++
    }
    for (const k of missing) {
      const entry = learn.get(k) ?? { jobs: 0, skippedJobs: 0, onlyGapJobs: 0 }
      entry.jobs++
      if (s.decision === "SKIPPED") entry.skippedJobs++
      if (missing.length === 1) entry.onlyGapJobs++
      learn.set(k, entry)
    }
    if (s.decision === "SKIPPED") blockers.set(s.blocker, (blockers.get(s.blocker) ?? 0) + 1)
    bands.set(s.expBand, (bands.get(s.expBand) ?? 0) + 1)
  }

  const total = signals.length
  return {
    totalJobs: total,
    applied: signals.filter((s) => s.decision === "APPLIED").length,
    skipped: signals.filter((s) => s.decision === "SKIPPED").length,
    skillDemand: [...demand.entries()]
      .map(([skill, jobs]) => ({ skill, jobs, share: total ? Math.round((jobs / total) * 1000) / 10 : 0, have: owns(skill) }))
      .sort((a, b) => b.jobs - a.jobs || a.skill.localeCompare(b.skill))
      .slice(0, 15),
    blockers: [...blockers.entries()]
      .map(([blocker, jobs]) => ({ blocker, jobs }))
      .sort((a, b) => b.jobs - a.jobs),
    experienceBands: [...bands.entries()]
      .map(([band, jobs]) => ({ band, jobs }))
      .sort((a, b) => BAND_ORDER.indexOf(a.band) - BAND_ORDER.indexOf(b.band)),
    learnNext: [...learn.entries()]
      .map(([skill, v]) => ({ skill, ...v }))
      .sort((a, b) => b.onlyGapJobs - a.onlyGapJobs || b.jobs - a.jobs || a.skill.localeCompare(b.skill))
      .slice(0, 8),
    coverage: mentions ? Math.round((owned / mentions) * 1000) / 10 : 0,
  }
}
