"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 bg-red-50/50 dark:bg-red-950/10 rounded-xl border border-red-100 dark:border-red-900/30">
      <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full mb-4">
        <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
      </div>
      <h2 className="text-xl font-bold text-red-900 dark:text-red-100">Something went wrong!</h2>
      <p className="text-red-700 dark:text-red-300 mt-2 max-w-sm">
        We encountered an error while loading your dashboard data.
      </p>
      <Button 
        variant="destructive" 
        onClick={() => reset()}
        className="mt-6"
      >
        Try again
      </Button>
    </div>
  )
}
