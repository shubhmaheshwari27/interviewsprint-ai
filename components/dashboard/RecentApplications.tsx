import Link from "next/link"
import { ArrowRight, Calendar, Building2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ApplicationStatusBadge } from "@/components/applications/ApplicationStatusBadge"
import { formatDate } from "@/lib/utils"
import type { Application } from "@prisma/client"

interface RecentApplicationsProps {
  applications: Application[]
}

export function RecentApplications({ applications }: RecentApplicationsProps) {
  return (
    <Card className="col-span-4 lg:col-span-2 shadow-sm border-slate-200 dark:border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-semibold">Recent Applications</CardTitle>
          <CardDescription>Your latest job tracking updates</CardDescription>
        </div>
        <Button variant="outline" size="sm" asChild className="rounded-full px-4">
          <Link href="/dashboard/applications">View All</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {applications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground italic bg-slate-50/50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
              No applications yet. Start by adding one!
            </div>
          ) : (
            applications.map((app) => (
              <div 
                key={app.id} 
                className="group flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{app.roleTitle}</span>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span className="font-medium">{app.companyName}</span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(app.applicationDate)}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <ApplicationStatusBadge status={app.status} />
                  <Button variant="ghost" size="icon" asChild className="rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={`/dashboard/applications/${app.id}`}>
                      <ArrowRight size={18} className="text-slate-400 hover:text-primary transition-colors" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
