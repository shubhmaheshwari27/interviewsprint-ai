import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/session-user"
import { getAnalytics } from "@/lib/analytics-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bars, EngineBadge, Stat } from "@/components/analytics/Bars"
import { PerDayChart, PortalChart } from "@/components/analytics/ChartsLazy"

export const metadata = { title: "Analytics · InterviewSprint AI" }

export default async function AnalyticsPage() {
  const user = await getSessionUser()
  if (!user) redirect("/login")

  const rows = await prisma.application.findMany({
    // Saved (wishlist) jobs are not applications yet.
    where: { userId: user.id, status: { not: "SAVED" } },
    select: { applicationDate: true, status: true, portal: true, channel: true },
    orderBy: { applicationDate: "asc" },
  })

  if (rows.length === 0) {
    return (
      <Card className="border-dashed border-2 py-12">
        <CardContent className="text-center space-y-4">
          <CardTitle className="text-2xl">No applications yet</CardTitle>
          <CardDescription>Add applications or import a CSV in Settings to see your job-hunt analytics.</CardDescription>
          <Button asChild>
            <Link href="/dashboard/settings">Import data</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const { summary, engine } = await getAnalytics(
    rows.map((r) => ({ ...r, applicationDate: r.applicationDate.toISOString() }))
  )
  const best = [...summary.byPortal].filter((p) => p.applications >= 5).sort((a, b) => b.responseRate - a.responseRate)[0]

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">Job-hunt analytics</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Where applications go, which channels answer, and how consistent the search is.
          </p>
        </div>
        <EngineBadge engine={engine} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Applications" value={summary.totalApplications} hint={`over ${summary.activeDays} active days`} />
        <Stat label="Responses" value={summary.responses} hint={`${summary.responseRate}% response rate`} />
        <Stat label="Interviews" value={summary.interviews} hint={`${summary.offers} offers`} />
        <Stat label="Per active day" value={summary.averagePerActiveDay} hint="applications on days the search ran" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Applications per day</CardTitle>
            <CardDescription>Days with no bar were days off.</CardDescription>
          </CardHeader>
          <CardContent>
            <PerDayChart data={summary.perDay} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Funnel</CardTitle>
            <CardDescription>A rejection counts as a response; silence does not.</CardDescription>
          </CardHeader>
          <CardContent>
            <Bars rows={summary.funnel.map((f) => ({ label: f.stage, value: f.count }))} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>By portal</CardTitle>
            <CardDescription>
              Applications and responses per channel.
              {best ? ` Best response rate so far: ${best.portal} (${best.responseRate}%).` : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PortalChart data={summary.byPortal} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Response rate by portal</CardTitle>
            <CardDescription>Portals with at least one application.</CardDescription>
          </CardHeader>
          <CardContent>
            <Bars
              rows={summary.byPortal.map((p) => ({ label: p.portal, value: p.responseRate, hint: `${p.responses}/${p.applications}` }))}
              max={100}
              suffix="%"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
