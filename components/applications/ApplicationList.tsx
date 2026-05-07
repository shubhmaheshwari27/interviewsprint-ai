import Link from "next/link"
import { Calendar, MapPin, ExternalLink, MoreVertical } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ApplicationStatusBadge } from "@/components/applications/ApplicationStatusBadge"
import { formatDate } from "@/lib/utils"
import type { Application } from "@prisma/client"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"

interface ApplicationListProps {
  applications: Application[]
}

export function ApplicationList({ applications }: ApplicationListProps) {
  if (applications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
        <div className="bg-slate-200 dark:bg-slate-800 p-4 rounded-full mb-4">
          <Calendar className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold">No applications found</h3>
        <p className="text-muted-foreground max-w-xs mt-2">
          Adjust your filters or add your first application to get started.
        </p>
        <Button asChild className="mt-6">
          <Link href="/dashboard/applications/new">Add Application</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {applications.map((app) => (
        <Card key={app.id} className="group hover:shadow-md transition-all border-slate-200 dark:border-slate-800">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">{app.roleTitle}</h3>
                  <ApplicationStatusBadge status={app.status} />
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                  <span className="font-medium text-slate-700 dark:text-slate-300">{app.companyName}</span>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Applied {formatDate(app.applicationDate)}</span>
                  </div>
                  {app.salaryRange && (
                    <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-xs">
                      {app.salaryRange}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button asChild variant="outline" size="sm" className="hidden sm:flex">
                  <Link href={`/dashboard/applications/${app.id}`}>
                    Details
                  </Link>
                </Button>
                <Button asChild size="sm">
                  <Link href={`/dashboard/applications/${app.id}`}>
                    <ExternalLink className="h-4 w-4 mr-2" /> View
                  </Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/applications/${app.id}/edit`}>Edit</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
