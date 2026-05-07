"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { statusConfig } from "@/lib/utils"
import { useTransition } from "react"

export function ApplicationFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const currentSearch = searchParams.get("q") ?? ""
  const currentStatus = searchParams.get("status") ?? "ALL"
  const currentSort = searchParams.get("sort") ?? "newest"

  function updateFilters(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams)
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === "ALL" || value === "") {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search by company or role..." 
          className="pl-10"
          defaultValue={currentSearch}
          onChange={(e) => {
            const val = e.target.value
            // Simple debounce logic could go here, for now just update on change
            updateFilters({ q: val })
          }}
        />
      </div>

      <div className="flex gap-4">
        <Select 
          value={currentStatus} 
          onValueChange={(val) => updateFilters({ status: val })}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            {Object.entries(statusConfig).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select 
          value={currentSort} 
          onValueChange={(val) => updateFilters({ sort: val })}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="company_az">Company (A-Z)</SelectItem>
            <SelectItem value="company_za">Company (Z-A)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
