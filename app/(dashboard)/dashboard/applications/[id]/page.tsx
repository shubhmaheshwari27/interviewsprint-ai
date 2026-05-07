import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { StatusUpdateDropdown } from "@/components/applications/StatusUpdateDropdown"
import { AIAnalysisSection } from "@/components/applications/AIAnalysisSection"
import { AddInterviewRoundModal } from "@/components/applications/AddInterviewRoundModal"
import { DeleteApplicationButton } from "@/components/applications/DeleteApplicationButton"
import { InterviewRoundActions } from "@/components/applications/InterviewRoundActions"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Edit, ChevronLeft, Calendar, DollarSign, Cpu, FileText } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ApplicationPageProps {
  params: Promise<{ id: string }>
}

export default async function ApplicationDetailPage({ params }: ApplicationPageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const { id } = await params

  const application = await prisma.application.findUnique({
    where: { id, userId: session.user.id },
    include: {
      interviewRounds: { orderBy: { scheduledAt: "asc" } },
      aiAnalysis: true
    }
  })

  if (!application) notFound()

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/dashboard/applications">
            <ChevronLeft className="mr-2 h-4 w-4" /> Back to Applications
          </Link>
        </Button>
        <div className="flex gap-2">
          <DeleteApplicationButton 
            applicationId={application.id} 
            companyName={application.companyName} 
          />
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/applications/${id}/edit`}>
              <Edit className="mr-2 h-4 w-4" /> Edit Details
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              {application.roleTitle}
            </h1>
            <StatusUpdateDropdown 
              applicationId={application.id} 
              currentStatus={application.status} 
            />
          </div>
          <p className="text-xl text-muted-foreground font-medium">{application.companyName}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" /> Application Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{formatDate(application.applicationDate)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" /> Salary Range
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{application.salaryRange || "Not specified"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Cpu className="h-4 w-4 text-primary" /> Tech Stack
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold truncate" title={application.techStack || ""}>
              {application.techStack || "Not specified"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-5">
        <div className="md:col-span-3 space-y-8">
          <section>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Job Description</h2>
            </div>
            <Card>
              <CardContent className="pt-6">
                <div className="prose dark:prose-invert max-w-none text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                  {application.jobDescription || "No job description provided."}
                </div>
              </CardContent>
            </Card>
          </section>

          <AIAnalysisSection 
            applicationId={application.id} 
            initialAnalysis={application.aiAnalysis} 
          />
        </div>

        <div className="md:col-span-2 space-y-6">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Interview Rounds</h2>
              <AddInterviewRoundModal applicationId={application.id} />
            </div>
            <div className="space-y-4">
              {application.interviewRounds.length === 0 ? (
                <p className="text-sm text-muted-foreground italic bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-dashed text-center">
                  No interview rounds scheduled yet.
                </p>
              ) : (
                application.interviewRounds.map((round) => (
                  <Card key={round.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <InterviewRoundActions round={round} applicationId={application.id} />
                        <div>
                          <p className="font-semibold">{round.name}</p>
                          <p className="text-xs text-muted-foreground">{round.type}</p>
                        </div>
                      </div>
                      <Badge variant={round.outcome === "PASSED" ? "default" : round.outcome === "FAILED" ? "destructive" : "secondary"}>
                        {round.outcome}
                      </Badge>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </section>

          {application.notes && (
            <section>
              <h2 className="text-xl font-bold mb-4">Notes</h2>
              <Card>
                <CardContent className="pt-6 text-sm">
                  {application.notes}
                </CardContent>
              </Card>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
