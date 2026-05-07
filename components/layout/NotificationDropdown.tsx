"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Bell, Briefcase, Sparkles, Calendar, Circle } from "lucide-react"

const notifications = [
  {
    id: 1,
    title: "Application Added",
    description: "Successfully added Google - Senior Engineer",
    time: "2 mins ago",
    icon: Briefcase,
    color: "text-blue-500",
    unread: true
  },
  {
    id: 2,
    title: "AI Analysis Ready",
    description: "Prep guide generated for Meta - Frontend",
    time: "1 hour ago",
    icon: Sparkles,
    color: "text-purple-500",
    unread: true
  },
  {
    id: 3,
    title: "Interview Scheduled",
    description: "Amazon Technical Round on May 10",
    time: "5 hours ago",
    icon: Calendar,
    color: "text-amber-500",
    unread: false
  }
]

export function NotificationDropdown() {
  const unreadCount = notifications.filter(n => n.unread).length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-950" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 shadow-2xl border-slate-200 dark:border-slate-800">
        <DropdownMenuLabel className="p-4 flex items-center justify-between">
          <span className="font-bold text-base">Notifications</span>
          <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            {unreadCount} New
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="m-0" />
        <div className="max-h-[350px] overflow-y-auto">
          {notifications.map((n) => {
            const Icon = n.icon
            return (
              <DropdownMenuItem key={n.id} className="p-4 flex gap-4 cursor-pointer focus:bg-slate-50 dark:focus:bg-slate-900 border-b border-slate-100 last:border-0 dark:border-slate-800">
                <div className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${n.color} bg-current/10`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{n.title}</p>
                    {n.unread && <Circle className="h-2 w-2 fill-primary text-primary" />}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{n.description}</p>
                  <p className="text-[10px] font-medium text-slate-400">{n.time}</p>
                </div>
              </DropdownMenuItem>
            )
          })}
        </div>
        <DropdownMenuSeparator className="m-0" />
        <div className="p-2">
          <Button variant="ghost" className="w-full text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800">
            View all notifications
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
