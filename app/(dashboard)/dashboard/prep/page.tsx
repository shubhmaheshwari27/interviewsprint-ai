import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles, ArrowRight, Brain, Briefcase } from "lucide-react"
import Link from "next/link"

export default async function AIPrepPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const applications = await prisma.application.findMany({
    where: { 
      userId: session.user.id,
      aiAnalysis: { isNot: null }
    },
    include: { aiAnalysis: true },
    orderBy: { updatedAt: "desc" }
  })

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">AI Preparation Hub</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Access AI-generated interview questions, skill analysis, and personalized prep roadmaps for your applications.
          </p>
        </div>
      </div>

      {applications.length === 0 ? (
        <Card className="border-dashed border-2 py-12">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <div className="bg-primary/10 p-4 rounded-full mb-4">
              <Brain className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-2xl mb-2">No AI Analysis Found</CardTitle>
            <CardDescription className="max-w-md mb-8 text-base">
              To use AI Preparation, add a job application with a job description, then generate the analysis from the application details page.
            </CardDescription>
            <Button size="lg" className="rounded-full px-8" asChild>
              <Link href="/dashboard/applications">
                Browse Applications <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {applications.map((app) => (
            <Card key={app.id} className="group hover:shadow-lg transition-all border-slate-200 dark:border-slate-800">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-primary/10 rounded text-primary">
                    <Briefcase className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {app.companyName}
                  </span>
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                  {app.roleTitle}
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  AI analysis ready for this role. Review questions and gaps.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full rounded-full" asChild>
                  <Link href={`/dashboard/applications/${app.id}`}>
                    <Sparkles className="mr-2 h-4 w-4 text-primary" />
                    View Prep Guide
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <section className="bg-slate-900 text-white p-8 md:p-12 rounded-3xl overflow-hidden relative">
        <div className="relative z-10 space-y-6 max-w-2xl">
          <Badge className="bg-primary/20 text-primary border-primary/20 hover:bg-primary/20">Pro Tip</Badge>
          <h2 className="text-3xl font-bold">Boost your interview performance</h2>
          <p className="text-slate-400 text-lg">
            Our AI analyzes thousands of job descriptions to find the exact keywords and concepts recruiters are looking for. 
            Make sure to check the "Skill Gaps" section to see where you can improve your resume.
          </p>
          <Button variant="secondary" size="lg" className="rounded-full px-8" asChild>
             <Link href="/dashboard/applications/new">Start New Application</Link>
          </Button>
        </div>
        <Sparkles className="absolute right-[-20px] bottom-[-20px] h-64 w-64 text-slate-800 opacity-50" />
      </section>
    </div>
  )
}

import { Badge } from "@/components/ui/badge"
