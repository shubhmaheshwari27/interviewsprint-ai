import Link from "next/link"
import { Sidebar } from "@/components/layout/Sidebar"
import { TopNav } from "@/components/layout/TopNav"
import { getSessionUser } from "@/lib/session-user"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getSessionUser().catch(() => null)

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <div className="hidden md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80]">
        <Sidebar />
      </div>
      <div className="md:pl-72 flex-1 flex flex-col h-full">
        {user?.isDemo && (
          <div className="bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-100 text-sm px-6 py-2 text-center">
            You are viewing the read-only demo with real, anonymised data from my own job search.{" "}
            <Link href="/register" className="underline font-medium">Create an account</Link> to track yours.
          </div>
        )}
        <TopNav />
        <main className="flex-1 overflow-y-auto p-8 lg:p-12">
          <div className="max-w-7xl mx-auto space-y-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
