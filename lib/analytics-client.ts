import { computeAnalytics, type AnalyticsInput, type AnalyticsSummary } from "@/lib/analytics"
import { computeMarket, type MarketInput, type MarketSummary } from "@/lib/market"

/**
 * Optional Java analytics service (analytics-service/, Spring Boot).
 * When ANALYTICS_SERVICE_URL is set, the summaries are computed there; if the
 * service is slow (over 2 s), down, or returns something malformed, the
 * built-in TypeScript implementation answers instead. The page never fails
 * because of the service.
 */
export type Engine = { name: "java-service" | "built-in"; note?: string }

const TIMEOUT_MS = 2000

async function callService<T>(path: string, body: unknown, isValid: (x: any) => boolean): Promise<T | null> {
  const base = process.env.ANALYTICS_SERVICE_URL?.replace(/\/$/, "")
  if (!base) return null
  try {
    const res = await fetch(`${base}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()
    if (!isValid(json)) throw new Error("Unexpected response shape")
    return json as T
  } catch (error: any) {
    console.warn(`[analytics-service] ${path} unavailable, using built-in engine:`, error?.message ?? error)
    return null
  }
}

const noteFor = () =>
  process.env.ANALYTICS_SERVICE_URL ? "Java service unavailable, computed in the app instead." : undefined

export async function getAnalytics(apps: AnalyticsInput[]): Promise<{ summary: AnalyticsSummary; engine: Engine }> {
  const remote = await callService<AnalyticsSummary>(
    "/api/v1/analytics/summary",
    { applications: apps },
    (x) => typeof x?.totalApplications === "number" && Array.isArray(x?.byPortal) && Array.isArray(x?.perDay)
  )
  if (remote) return { summary: remote, engine: { name: "java-service" } }
  return { summary: computeAnalytics(apps), engine: { name: "built-in", note: noteFor() } }
}

export async function getMarket(input: MarketInput): Promise<{ summary: MarketSummary; engine: Engine }> {
  const remote = await callService<MarketSummary>(
    "/api/v1/market/summary",
    input,
    (x) => typeof x?.totalJobs === "number" && Array.isArray(x?.skillDemand) && Array.isArray(x?.learnNext)
  )
  if (remote) return { summary: remote, engine: { name: "java-service" } }
  return { summary: computeMarket(input), engine: { name: "built-in", note: noteFor() } }
}
