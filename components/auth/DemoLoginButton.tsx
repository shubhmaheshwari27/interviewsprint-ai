"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { PlayCircle } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

// Public, read-only demo credentials (the account cannot change any data).
const DEMO_EMAIL = process.env.NEXT_PUBLIC_DEMO_EMAIL || "demo@interviewsprint.dev"
const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_PASSWORD || "demo-sprint-2026"

export function DemoLoginButton({ size = "default", className }: { size?: "default" | "lg"; className?: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function onClick() {
    startTransition(async () => {
      const result = await signIn("credentials", { email: DEMO_EMAIL, password: DEMO_PASSWORD, redirect: false })
      if (result?.error) {
        toast.error("The demo is not available right now.")
        return
      }
      router.push("/dashboard/analytics")
      router.refresh()
    })
  }

  return (
    <Button variant="secondary" size={size} className={className} onClick={onClick} disabled={isPending}>
      <PlayCircle className="mr-2 h-4 w-4" />
      {isPending ? "Opening demo…" : "Try the live demo"}
    </Button>
  )
}
