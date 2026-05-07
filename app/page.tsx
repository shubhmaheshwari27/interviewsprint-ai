import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          InterviewSprint AI
        </p>
      </div>

      <div className="flex flex-col items-center justify-center flex-1 text-center">
        <h1 className="text-6xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-7xl">
          Ace Your Next <span className="text-primary">Interview</span>
        </h1>
        <p className="mt-6 text-xl text-slate-600 dark:text-slate-400 max-w-2xl">
          Track job applications, generate AI prep materials, and bridge skill gaps with InterviewSprint AI.
        </p>
        <div className="mt-10 flex gap-4">
          <Button asChild size="lg">
            <Link href="/login">Get Started</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/register">Register</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
