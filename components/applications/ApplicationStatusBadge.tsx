import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface ApplicationStatusBadgeProps {
  status: string
  className?: string
}

const statusMap: Record<string, { label: string; className: string }> = {
  APPLIED: {
    label: "Applied",
    className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
  },
  SCREENING: {
    label: "Screening",
    className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
  },
  INTERVIEWING: {
    label: "Interviewing",
    className: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-800",
  },
  OFFER: {
    label: "Offer",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800",
  },
  WITHDRAWN: {
    label: "Withdrawn",
    className: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-800",
  },
}

export function ApplicationStatusBadge({ status, className }: ApplicationStatusBadgeProps) {
  const config = statusMap[status] || { label: status, className: "" }

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "px-2.5 py-0.5 rounded-full font-semibold text-[10px] uppercase tracking-wider",
        config.className,
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current mr-1.5" />
      {config.label}
    </Badge>
  )
}
