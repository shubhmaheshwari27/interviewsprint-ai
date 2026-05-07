import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"
import type { ApplicationStatus } from "@prisma/client"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  if (!date) return "N/A"
  return format(new Date(date), "MMM d, yyyy")
}

export const statusConfig: Record<
  ApplicationStatus,
  { label: string; color: string; bgColor: string }
> = {
  APPLIED:      { label: "Applied",      color: "text-blue-700",   bgColor: "bg-blue-100"   },
  SCREENING:    { label: "Screening",    color: "text-purple-700", bgColor: "bg-purple-100" },
  INTERVIEWING: { label: "Interviewing", color: "text-yellow-700", bgColor: "bg-yellow-100" },
  OFFER:        { label: "Offer",        color: "text-green-700",  bgColor: "bg-green-100"  },
  REJECTED:     { label: "Rejected",     color: "text-red-700",    bgColor: "bg-red-100"    },
  WITHDRAWN:    { label: "Withdrawn",    color: "text-gray-700",   bgColor: "bg-gray-100"   },
}
