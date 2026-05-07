"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Briefcase, 
  Settings, 
  LogOut,
  Sparkles,
  Search,
  PlusCircle
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { signOut } from "next-auth/react"

const routes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    color: "text-sky-500",
  },
  {
    label: "Applications",
    icon: Briefcase,
    href: "/dashboard/applications",
    color: "text-violet-500",
  },
  {
    label: "AI Preparation",
    icon: Sparkles,
    href: "/dashboard/prep",
    color: "text-pink-700",
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-none">
      <div className="px-6 py-2 flex items-center gap-2 mb-4">
        <div className="bg-primary text-primary-foreground p-1.5 rounded-xl shadow-lg shadow-primary/20">
          <Sparkles className="h-5 w-5" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          SprintAI
        </h1>
      </div>

      <div className="px-3 flex-1">
        <div className="space-y-1">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "text-sm group flex p-3 w-full justify-start font-semibold cursor-pointer rounded-xl transition-all duration-200",
                pathname === route.href 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]" 
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <div className="flex items-center flex-1">
                <route.icon className={cn("h-5 w-5 mr-3 transition-colors", pathname === route.href ? "text-primary-foreground" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300")} />
                {route.label}
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8">
          <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500/60">
            Actions
          </p>
          <div className="space-y-1">
            <Link
              href="/dashboard/applications/new"
              className="text-sm group flex p-3 w-full justify-start font-semibold cursor-pointer bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all border border-slate-200 dark:border-slate-800"
            >
              <div className="flex items-center flex-1 text-slate-900 dark:text-white">
                <PlusCircle className="h-5 w-5 mr-3 text-primary" />
                Add New Job
              </div>
            </Link>
          </div>
        </div>
      </div>

      <div className="px-3 py-4 mt-auto border-t border-slate-200 dark:border-slate-800">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-slate-500 dark:text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="h-5 w-5 mr-3" />
          Logout
        </Button>
      </div>
    </div>
  )
}
