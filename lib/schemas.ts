import { z } from "zod"

export const ApplicationStatusEnum = z.enum([
  "APPLIED", "SCREENING", "INTERVIEWING", "OFFER", "REJECTED", "WITHDRAWN",
])

export const CreateApplicationSchema = z.object({
  companyName:     z.string().min(1, "Company name is required").max(100),
  roleTitle:       z.string().min(1, "Role title is required").max(100),
  jobDescription:  z.string().max(10000).optional().default(""),
  status:          ApplicationStatusEnum.default("APPLIED"),
  applicationDate: z.string().min(1, "Date is required"),
  techStack:       z.string().max(500).optional().default(""),
  notes:           z.string().max(5000).optional().default(""),
  salaryRange:     z.string().max(50).optional().default(""),
  interviewStage:  z.string().max(200).optional().default(""),
})

export type CreateApplicationInput = z.infer<typeof CreateApplicationSchema>

export const InterviewRoundSchema = z.object({
  name: z.string().min(1, "Round name is required").max(100),
  scheduledAt: z.string().optional(),
  type: z.enum(["PHONE", "TECHNICAL", "SYSTEM_DESIGN", "BEHAVIORAL", "HR", "ONSITE"]),
  outcome: z.enum(["PASSED", "FAILED", "PENDING", "CANCELLED"]).optional().default("PENDING"),
  notes: z.string().max(5000).optional().default(""),
})
