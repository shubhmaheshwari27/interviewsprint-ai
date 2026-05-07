import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { StatsCards } from "@/components/dashboard/StatsCards"
import { RecentApplications } from "@/components/dashboard/RecentApplications"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"
import { ChartWrapper } from "@/components/dashboard/ChartWrapper"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const now = new Date()
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

  // Fetch summary data
  const [
    total, 
    totalLastMonth,
    statusCounts, 
    statusCountsLastMonth,
    recent
  ] = await Promise.all([
    prisma.application.count({ where: { userId: session.user.id } }),
    prisma.application.count({ 
      where: { 
        userId: session.user.id,
        createdAt: { lt: startOfThisMonth }
      } 
    }),
    prisma.application.groupBy({
      by: ["status"],
      where: { userId: session.user.id },
      _count: { status: true }
    }),
    prisma.application.groupBy({
      by: ["status"],
      where: { 
        userId: session.user.id,
        createdAt: { lt: startOfThisMonth }
      },
      _count: { status: true }
    }),
    prisma.application.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 5
    })
  ])

  // Helper to calculate percentage change
  const calculateDelta = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 100)
  }

  // Format counts for StatsCards
  const countsMap = statusCounts.reduce((acc, curr) => {
    acc[curr.status] = curr._count.status
    return acc
  }, {} as Record<string, number>)

  const lastMonthCountsMap = statusCountsLastMonth.reduce((acc, curr) => {
    acc[curr.status] = curr._count.status
    return acc
  }, {} as Record<string, number>)

  const statsWithDelta = {
    total: {
      count: total,
      delta: calculateDelta(total, totalLastMonth)
    },
    interviewing: {
      count: countsMap["INTERVIEWING"] || 0,
      delta: calculateDelta(countsMap["INTERVIEWING"] || 0, lastMonthCountsMap["INTERVIEWING"] || 0)
    },
    offers: {
      count: countsMap["OFFER"] || 0,
      delta: calculateDelta(countsMap["OFFER"] || 0, lastMonthCountsMap["OFFER"] || 0)
    },
    rejected: {
      count: countsMap["REJECTED"] || 0,
      delta: calculateDelta(countsMap["REJECTED"] || 0, lastMonthCountsMap["REJECTED"] || 0)
    }
  }

  // Format data for chart
  const chartData = statusCounts.map(s => ({
    status: s.status,
    count: s._count.status
  }))

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Welcome back! Here's an overview of your active job search and AI preparation status.
          </p>
        </div>
        <Button size="lg" className="rounded-full px-6 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95" asChild>
          <Link href="/dashboard/applications/new">
            <Plus className="mr-2 h-5 w-5" />
            Add Application
          </Link>
        </Button>
      </div>

      <div className="space-y-8">
        <StatsCards stats={statsWithDelta} />

        <div className="grid gap-10 grid-cols-1 lg:grid-cols-4">
          <ChartWrapper data={chartData} />
          <RecentApplications applications={recent} />
        </div>
      </div>
    </div>
  )
}
