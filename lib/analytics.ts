/**
 * Job-hunt analytics computed from a user's applications.
 * Pure and deterministic, so the same logic is easy to test and to mirror in
 * the Java analytics service (analytics-service/), which returns the same shape.
 */

export type AnalyticsInput = {
  applicationDate: string // ISO date
  status: "APPLIED" | "SCREENING" | "INTERVIEWING" | "OFFER" | "REJECTED" | "WITHDRAWN"
  portal: string | null
  channel: "PORTAL" | "EMAIL" | "REFERRAL" | "OTHER"
}

export type PortalStat = { portal: string; applications: number; responses: number; responseRate: number }
export type DayStat = { date: string; applications: number }
export type FunnelStage = { stage: string; count: number }

export type AnalyticsSummary = {
  totalApplications: number
  responses: number
  responseRate: number // 0-100, one decimal
  interviews: number
  offers: number
  activeDays: number
  averagePerActiveDay: number
  funnel: FunnelStage[]
  byPortal: PortalStat[]
  byChannel: { channel: string; applications: number }[]
  perDay: DayStat[]
}

/** A response is anything past "Applied" (a rejection is still an answer). Withdrawn is not. */
export const isResponse = (s: AnalyticsInput["status"]) => s !== "APPLIED" && s !== "WITHDRAWN"
const reachedInterview = (s: AnalyticsInput["status"]) => s === "INTERVIEWING" || s === "OFFER"
const pct = (part: number, whole: number) => (whole === 0 ? 0 : Math.round((part / whole) * 1000) / 10)

export function computeAnalytics(apps: AnalyticsInput[]): AnalyticsSummary {
  const total = apps.length
  const responses = apps.filter((a) => isResponse(a.status)).length
  const interviews = apps.filter((a) => reachedInterview(a.status)).length
  const offers = apps.filter((a) => a.status === "OFFER").length

  const portalMap = new Map<string, { applications: number; responses: number }>()
  const channelMap = new Map<string, number>()
  const dayMap = new Map<string, number>()

  for (const a of apps) {
    const portal = a.portal?.trim() || "Other"
    const p = portalMap.get(portal) ?? { applications: 0, responses: 0 }
    p.applications++
    if (isResponse(a.status)) p.responses++
    portalMap.set(portal, p)

    channelMap.set(a.channel, (channelMap.get(a.channel) ?? 0) + 1)

    const day = a.applicationDate.slice(0, 10)
    dayMap.set(day, (dayMap.get(day) ?? 0) + 1)
  }

  const byPortal = [...portalMap.entries()]
    .map(([portal, v]) => ({ portal, ...v, responseRate: pct(v.responses, v.applications) }))
    .sort((a, b) => b.applications - a.applications || a.portal.localeCompare(b.portal))

  const perDay = [...dayMap.entries()]
    .map(([date, applications]) => ({ date, applications }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return {
    totalApplications: total,
    responses,
    responseRate: pct(responses, total),
    interviews,
    offers,
    activeDays: perDay.length,
    averagePerActiveDay: perDay.length ? Math.round((total / perDay.length) * 10) / 10 : 0,
    funnel: [
      { stage: "Applied", count: total },
      { stage: "Responded", count: responses },
      { stage: "Interview", count: interviews },
      { stage: "Offer", count: offers },
    ],
    byPortal,
    byChannel: [...channelMap.entries()]
      .map(([channel, applications]) => ({ channel, applications }))
      .sort((a, b) => b.applications - a.applications),
    perDay,
  }
}
