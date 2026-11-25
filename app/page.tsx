import Link from "next/link"
import { BarChart3, Brain, Radar, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DemoLoginButton } from "@/components/auth/DemoLoginButton"

const FEATURES = [
  {
    icon: BarChart3,
    title: "Job-hunt analytics",
    text: "Applications per day, response rate by portal, and a funnel from applied to offer.",
  },
  {
    icon: Radar,
    title: "Market skill gap",
    text: "Which skills the jobs you screen actually ask for, and which one would unlock the most roles.",
  },
  {
    icon: Brain,
    title: "AI interview prep",
    text: "Questions, skill gaps and a prep roadmap per job description, with an offline fallback if the AI is down.",
  },
  {
    icon: ShieldCheck,
    title: "Built to degrade gracefully",
    text: "AI and the Java analytics service are optional: when either fails, the app keeps working.",
  },
]

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-5xl px-6 py-20 flex flex-col items-center text-center">
        <span className="rounded-full border border-slate-300 dark:border-slate-700 px-4 py-1 text-sm text-slate-600 dark:text-slate-400">
          InterviewSprint AI
        </span>
        <h1 className="mt-6 text-5xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-6xl">
          Run your job search like a <span className="text-primary">data project</span>
        </h1>
        <p className="mt-6 text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
          Track every application, see which portals actually respond, learn what the market wants, and prepare for
          each interview with AI. The demo runs on real, anonymised data from my own job search.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <DemoLoginButton size="lg" />
          <Button asChild size="lg">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/register">Create account</Link>
          </Button>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 text-left w-full">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-6">
              <f.icon className="h-6 w-6 text-primary" />
              <h2 className="mt-3 font-semibold text-slate-900 dark:text-white">{f.title}</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{f.text}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
