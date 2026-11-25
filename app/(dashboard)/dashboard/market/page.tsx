import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/session-user"
import { getMarket } from "@/lib/analytics-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bars, EngineBadge, Stat } from "@/components/analytics/Bars"

export const metadata = { title: "Market Gap · InterviewSprint AI" }

export default async function MarketPage() {
  const user = await getSessionUser()
  if (!user) redirect("/login")

  const signals = await prisma.marketSignal.findMany({
    where: { userId: user.id },
    select: { decision: true, blocker: true, expBand: true, skills: true },
  })

  if (signals.length === 0) {
    return (
      <Card className="border-dashed border-2 py-12">
        <CardContent className="text-center space-y-4">
          <CardTitle className="text-2xl">No market data yet</CardTitle>
          <CardDescription>
            Import a market CSV (every job you screened, with the skills it required) in Settings to see what the market asks for.
          </CardDescription>
          <Button asChild>
            <Link href="/dashboard/settings">Import data</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const { summary, engine } = await getMarket({
    userSkills: user.skills,
    signals: signals.map((s) => ({ ...s, decision: s.decision === "APPLIED" ? "APPLIED" : "SKIPPED" })),
  })
  const top = summary.learnNext[0]

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">Market gap</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            What the jobs you screened actually ask for, why some were skipped, and what to learn next.
          </p>
        </div>
        <EngineBadge engine={engine} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Jobs screened" value={summary.totalJobs} />
        <Stat label="Applied" value={summary.applied} hint={`${summary.skipped} skipped`} />
        <Stat label="Skill coverage" value={`${summary.coverage}%`} hint="of skill mentions you already have" />
        <Stat label="Learn next" value={top?.skill ?? "—"} hint={top ? `would clear ${top.onlyGapJobs} jobs where it was the only gap` : undefined} />
      </div>

      {user.skills.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Add your skills in <Link className="text-primary underline" href="/dashboard/settings">Settings</Link> to see which demanded skills you already have.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Most demanded skills</CardTitle>
            <CardDescription>Share of screened jobs asking for each skill. Green = you have it.</CardDescription>
          </CardHeader>
          <CardContent>
            <Bars
              rows={summary.skillDemand.map((s) => ({ label: s.skill, value: s.jobs, hint: `${s.share}%` }))}
              highlight={(label) => summary.skillDemand.find((s) => s.skill === label)?.have ?? false}
            />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Skills to learn next</CardTitle>
              <CardDescription>Missing skills ranked by how many jobs they would open up.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-muted-foreground">
                    <tr>
                      <th className="py-2 font-medium">Skill</th>
                      <th className="py-2 font-medium text-right">Jobs asking</th>
                      <th className="py-2 font-medium text-right">Only gap</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.learnNext.map((s) => (
                      <tr key={s.skill} className="border-t border-slate-100 dark:border-slate-800">
                        <td className="py-2"><Badge variant="secondary">{s.skill}</Badge></td>
                        <td className="py-2 text-right tabular-nums">{s.jobs}</td>
                        <td className="py-2 text-right tabular-nums">{s.onlyGapJobs}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Why jobs were skipped</CardTitle>
            </CardHeader>
            <CardContent>
              <Bars rows={summary.blockers.map((b) => ({ label: b.blocker, value: b.jobs }))} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Experience asked for</CardTitle>
            </CardHeader>
            <CardContent>
              <Bars rows={summary.experienceBands.map((b) => ({ label: b.band, value: b.jobs }))} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
