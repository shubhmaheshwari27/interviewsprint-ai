import { describe, expect, it } from "vitest"
import { computeAnalytics, type AnalyticsInput } from "@/lib/analytics"

const app = (date: string, status: AnalyticsInput["status"], portal: string | null, channel: AnalyticsInput["channel"] = "PORTAL"): AnalyticsInput => ({
  applicationDate: `${date}T00:00:00.000Z`,
  status,
  portal,
  channel,
})

describe("computeAnalytics", () => {
  it("returns zeros for no applications", () => {
    const s = computeAnalytics([])
    expect(s.totalApplications).toBe(0)
    expect(s.responseRate).toBe(0)
    expect(s.averagePerActiveDay).toBe(0)
    expect(s.perDay).toEqual([])
  })

  it("counts responses, interviews, offers and the funnel", () => {
    const s = computeAnalytics([
      app("2026-11-10", "APPLIED", "Naukri"),
      app("2026-11-10", "SCREENING", "Naukri"),
      app("2026-11-11", "REJECTED", "Email", "EMAIL"),
      app("2026-11-11", "INTERVIEWING", "LinkedIn"),
      app("2026-11-12", "OFFER", "LinkedIn"),
      app("2026-11-12", "WITHDRAWN", "Wellfound"),
    ])
    expect(s.totalApplications).toBe(6)
    expect(s.responses).toBe(4) // screening, rejected, interviewing, offer
    expect(s.responseRate).toBe(66.7)
    expect(s.interviews).toBe(2)
    expect(s.offers).toBe(1)
    expect(s.funnel.map((f) => f.count)).toEqual([6, 4, 2, 1])
    expect(s.activeDays).toBe(3)
    expect(s.averagePerActiveDay).toBe(2)
  })

  it("groups by portal (sorted by volume) and by day (sorted by date)", () => {
    const s = computeAnalytics([
      app("2026-11-12", "APPLIED", "Naukri"),
      app("2026-11-10", "SCREENING", "Naukri"),
      app("2026-11-11", "APPLIED", null),
    ])
    expect(s.byPortal[0]).toEqual({ portal: "Naukri", applications: 2, responses: 1, responseRate: 50 })
    expect(s.byPortal[1].portal).toBe("Other")
    expect(s.perDay.map((d) => d.date)).toEqual(["2026-11-10", "2026-11-11", "2026-11-12"])
  })
})
