"use client"

import { useTransition } from "react"
import { updateApplication } from "@/actions/applications"
import { statusConfig } from "@/lib/utils"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"
import { ApplicationStatusBadge } from "./ApplicationStatusBadge"

interface StatusUpdateDropdownProps {
  applicationId: string
  currentStatus: string
}

export function StatusUpdateDropdown({ applicationId, currentStatus }: StatusUpdateDropdownProps) {
  const [isPending, startTransition] = useTransition()

  async function handleUpdate(status: string) {
    if (status === currentStatus) return

    startTransition(async () => {
      const formData = new FormData()
      formData.append("status", status)
      
      const result = await updateApplication(applicationId, formData)
      if (result.success) {
        toast.success(`Status updated to ${statusConfig[status as keyof typeof statusConfig].label}`)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-auto p-0 hover:bg-transparent" disabled={isPending}>
          <ApplicationStatusBadge status={currentStatus as any} />
          <ChevronDown className="ml-1 h-3 w-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {Object.entries(statusConfig).map(([key, config]) => (
          <DropdownMenuItem 
            key={key} 
            onClick={() => handleUpdate(key)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className={`w-2 h-2 rounded-full ${config.color}`} />
            {config.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
