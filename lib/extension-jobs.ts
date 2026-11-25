import { z } from "zod"
import { stableKey, normalisePortal } from "@/lib/import"
import { detectSkills } from "@/lib/skills"

/** Payload the browser extension sends for the job it extracted from the page. */
export const ExtensionJobSchema = z.object({
  title: z.string().trim().min(1, "Role title is required").max(100),
  company: z.string().trim().min(1, "Company is required").max(100),
  location: z.string().trim().max(150).optional().default(""),
  description: z.string().max(10_000).optional().default(""),
  url: z.string().trim().url("A valid job URL is required").max(500),
  portal: z.string().trim().max(50).optional().default(""),
  salary: z.string().trim().max(50).optional().default(""),
  status: z.enum(["SAVED", "APPLIED"]).optional().default("SAVED"),
  analyze: z.boolean().optional().default(false),
})
export type ExtensionJob = z.infer<typeof ExtensionJobSchema>

/** Strip tracking parameters so the same job always gets the same key. */
export function canonicalJobUrl(raw: string): string {
  try {
    const u = new URL(raw)
    const keep = new Set(["currentJobId", "jobId", "id", "jk", "gh_jid", "job"])
    const params = new URLSearchParams()
    for (const [k, v] of u.searchParams) if (keep.has(k)) params.set(k, v)
    const query = params.toString()
    return `${u.origin}${u.pathname.replace(/\/$/, "")}${query ? `?${query}` : ""}`.toLowerCase()
  } catch {
    return raw.trim().toLowerCase()
  }
}

export function jobExternalKey(url: string): string {
  return stableKey("url", canonicalJobUrl(url))
}

export function portalFromUrl(url: string, fallback = ""): string {
  if (fallback) return normalisePortal(fallback).portal
  try {
    const host = new URL(url).hostname.replace(/^www\./, "")
    const known: [RegExp, string][] = [
      [/linkedin\./, "LinkedIn"],
      [/naukri\./, "Naukri"],
      [/instahyre\./, "Instahyre"],
      [/wellfound\.|angel\.co/, "Wellfound"],
      [/indeed\./, "Indeed"],
      [/cutshort\./, "Cutshort"],
      [/foundit\.|monsterindia\./, "Hirist/Foundit"],
      [/hirist\./, "Hirist/Foundit"],
      [/greenhouse\.io|lever\.co|ashbyhq\.com|workable\.com|smartrecruiters\.com/, "Company site"],
    ]
    return known.find(([re]) => re.test(host))?.[1] ?? "Company site"
  } catch {
    return "Other"
  }
}

/** Fit score of a job against the user's skills, using the shared skill dictionary. */
export function fitScore(text: string, userSkills: string[]) {
  const skills = detectSkills(text)
  const have = new Set(userSkills.map((s) => s.toLowerCase()))
  const matched = skills.filter((s) => have.has(s.toLowerCase()))
  const missing = skills.filter((s) => !have.has(s.toLowerCase()))
  return {
    skills,
    matched,
    missing,
    matchPct: skills.length ? Math.round((matched.length / skills.length) * 100) : null,
  }
}
