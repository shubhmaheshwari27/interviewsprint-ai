import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { 
  Briefcase, 
  Clock, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  TrendingDown, 
  Minus 
} from "lucide-react"

interface StatItem {
  count: number
  delta: number
}

interface StatsCardsProps {
  stats: {
    total: StatItem
    interviewing: StatItem
    offers: StatItem
    rejected: StatItem
  }
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Total Applications",
      value: stats.total.count,
      delta: stats.total.delta,
      icon: Briefcase,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-900/10",
      border: "border-blue-100 dark:border-blue-900/20"
    },
    {
      title: "Interviewing",
      value: stats.interviewing.count,
      delta: stats.interviewing.delta,
      icon: Clock,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-900/10",
      border: "border-amber-100 dark:border-amber-900/20"
    },
    {
      title: "Offers Received",
      value: stats.offers.count,
      delta: stats.offers.delta,
      icon: CheckCircle,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-900/10",
      border: "border-emerald-100 dark:border-emerald-900/20"
    },
    {
      title: "Rejected",
      value: stats.rejected.count,
      delta: stats.rejected.delta,
      icon: XCircle,
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-50 dark:bg-rose-900/10",
      border: "border-rose-100 dark:border-rose-900/20"
    }
  ]

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        const isPositive = card.delta > 0
        const isNegative = card.delta < 0
        const isNeutral = card.delta === 0

        return (
          <Card key={card.title} className={`border ${card.border} shadow-sm card-hover bg-card`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-xl ${card.bg}`}>
                <Icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight mb-2">
                {card.value}
              </div>
              <div className="flex items-center gap-1.5">
                {isPositive && <TrendingUp className="h-4 w-4 text-emerald-500" />}
                {isNegative && <TrendingDown className="h-4 w-4 text-rose-500" />}
                {isNeutral && <Minus className="h-4 w-4 text-slate-400" />}
                
                <p className={`text-xs font-semibold ${
                  isPositive ? "text-emerald-500" : 
                  isNegative ? "text-rose-500" : 
                  "text-slate-500"
                }`}>
                  {isPositive ? "+" : ""}{card.delta}% 
                  <span className="text-muted-foreground font-normal ml-1">vs last month</span>
                </p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
