"use client"

import { useState, useTransition } from "react"
import { Sparkles, Brain, ListChecks, Target, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { analyzeJobDescription } from "@/actions/ai"
import { toast } from "sonner"
import type { AIAnalysis } from "@prisma/client"

interface AIAnalysisSectionProps {
  applicationId: string
  initialAnalysis: AIAnalysis | null
}

export function AIAnalysisSection({ applicationId, initialAnalysis }: AIAnalysisSectionProps) {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(initialAnalysis)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  async function handleAnalyze() {
    setError(null)
    startTransition(async () => {
      const result = await analyzeJobDescription(applicationId)
      if (result.success) {
        toast.success("AI Analysis generated!")
        setAnalysis(result.data)
      } else {
        toast.error(result.error)
        setError(result.error)
      }
    })
  }

  if (!analysis && !isPending) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="bg-primary/10 p-4 rounded-full mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="mb-2">AI Interview Preparation</CardTitle>
          <p className="text-muted-foreground max-w-sm mb-6">
            Our AI can analyze the job description to generate custom interview questions, identify skill gaps, and more.
          </p>
          <Button onClick={handleAnalyze} variant="outline" className="group">
            <Brain className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" /> Generate AI Analysis
          </Button>
          {error && (
            <div className="mt-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 text-center">
              <p className="text-sm text-red-600 dark:text-red-400 mb-3">{error}</p>
              <Button onClick={handleAnalyze} size="sm" variant="outline" className="border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                Try Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (isPending) {
    return (
      <Card className="animate-pulse">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Sparkles className="h-8 w-8 text-primary animate-spin mb-4" />
          <CardTitle>AI is analyzing...</CardTitle>
          <p className="text-muted-foreground mt-2">Extracting insights from the job description.</p>
        </CardContent>
      </Card>
    )
  }

  if (!analysis) return null

  // Helper to cast JsonValue to expected arrays
  const questions = (analysis.interviewQuestions as any[]) || []
  const skillGaps = (analysis.skillGaps as any[]) || []
  const resumeTips = (analysis.resumeTips as string[]) || []
  const roadmap = (analysis.preparationRoadmap as any[]) || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">AI Preparation Guide</h2>
        </div>
        <Button variant="outline" size="sm" onClick={handleAnalyze} disabled={isPending}>
          <Brain className="mr-2 h-4 w-4" /> Refresh Analysis
        </Button>
      </div>

      <Tabs defaultValue="questions" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="questions" className="flex gap-2">
            <Target className="h-4 w-4" /> <span className="hidden sm:inline">Questions</span>
          </TabsTrigger>
          <TabsTrigger value="gaps" className="flex gap-2">
            <Brain className="h-4 w-4" /> <span className="hidden sm:inline">Skill Gaps</span>
          </TabsTrigger>
          <TabsTrigger value="tips" className="flex gap-2">
            <ListChecks className="h-4 w-4" /> <span className="hidden sm:inline">Resume Tips</span>
          </TabsTrigger>
          <TabsTrigger value="roadmap" className="flex gap-2">
            <Calendar className="h-4 w-4" /> <span className="hidden sm:inline">Roadmap</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="questions" className="mt-4">
          <div className="grid gap-4">
            {questions.map((q, i) => (
              <Card key={i}>
                <CardHeader className="py-3">
                  <Badge variant="secondary" className="w-fit">{q.category}</Badge>
                </CardHeader>
                <CardContent>
                  <p className="font-medium text-slate-900 dark:text-slate-100">{q.question}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="gaps" className="mt-4">
          <div className="grid gap-4">
            {skillGaps.map((gap, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between py-3">
                  <CardTitle className="text-base">{gap.skill}</CardTitle>
                  <Badge variant={gap.importance === "High" ? "destructive" : "outline"}>
                    {gap.importance} Importance
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{gap.reason}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tips" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <ul className="space-y-3">
                {resumeTips.map((tip, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="flex-shrink-0 bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center font-bold">{i + 1}</span>
                    <p className="pt-0.5">{tip}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roadmap" className="mt-4">
          <div className="space-y-4">
            {roadmap.map((step, i) => (
              <div key={i} className="relative pl-8 border-l-2 border-slate-200 dark:border-slate-800 pb-4 last:pb-0">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary border-4 border-white dark:border-slate-950" />
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold uppercase text-primary">Week {step.week}</span>
                  <h4 className="font-semibold">{step.focus}</h4>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {step.resources.map((res: string, j: number) => (
                      <Badge key={j} variant="secondary" className="text-[10px]">{res}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
