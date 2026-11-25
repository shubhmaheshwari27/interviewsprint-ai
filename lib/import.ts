import { createHash } from "node:crypto"
import type { ApplicationChannel, ApplicationStatus } from "@prisma/client"
import { detectSkills, normaliseSkills } from "@/lib/skills"

/**
 * Turns rows from a job-hunt tracker CSV into applications, and rows from a
 * market CSV into market signals. Pure functions so they are easy to test.
 *
 * Tracker CSV columns (case-insensitive): date, portal, company, role, status
 * Market CSV columns: date, portal, company, role, exp_band (or exp_min),
 *                     decision, blocker, skills ("React;Node.js;SQL")
 */

export type ImportedApplication = {
  externalKey: string
  applicationDate: Date
  companyName: string
  roleTitle: string
  portal: string
  channel: ApplicationChannel
  status: ApplicationStatus
}

export type ImportedSignal = {
  externalKey: string
  date: Date
  portal: string
  company: string | null
  roleTitle: string
  expBand: string
  decision: "APPLIED" | "SKIPPED"
  blocker: string
  skills: string[]
}

const APPLIED_STATUSES = new Set(["applied", "emailed", "submitted", "submitted by user", "form submitted", "replied"])
const STATUS_MAP: Record<string, ApplicationStatus> = {
  applied: "APPLIED",
  emailed: "APPLIED",
  submitted: "APPLIED",
  "submitted by user": "APPLIED",
  "form submitted": "SCREENING",
  replied: "SCREENING",
  screening: "SCREENING",
  interviewing: "INTERVIEWING",
  offer: "OFFER",
  rejected: "REJECTED",
  withdrawn: "WITHDRAWN",
}
const DATE = /^\d{4}-\d{2}-\d{2}$/

export const stableKey = (...parts: string[]) =>
  createHash("sha1").update(parts.map((p) => p.trim().toLowerCase()).join("|")).digest("hex").slice(0, 24)

export function normalisePortal(raw: string): { portal: string; channel: ApplicationChannel } {
  let p = (raw || "").trim()
  let low = p.toLowerCase()
  if (low.startsWith("email")) return { portal: "Email", channel: "EMAIL" }
  if (low.startsWith("referral")) return { portal: "Referral", channel: "REFERRAL" }
  if (low.startsWith("remote-abroad:")) {
    p = p.split(":", 2)[1].trim()
    low = p.toLowerCase()
  }
  if (low.includes("linkedin")) return { portal: "LinkedIn", channel: "PORTAL" }
  if (low.startsWith("indeed")) return { portal: "Indeed", channel: "PORTAL" }
  if (low.startsWith("careers:") || /\bats\b/.test(low)) return { portal: "Company site", channel: "PORTAL" }
  if (low.includes("hirist") || low.includes("foundit")) return { portal: "Hirist/Foundit", channel: "PORTAL" }
  return { portal: (p || "Other").slice(0, 50), channel: "PORTAL" }
}

export function expBandFrom(min: string | undefined): string {
  const n = Number.parseFloat(min ?? "")
  if (Number.isNaN(n)) return "Not stated"
  if (n < 1) return "0–1 yrs"
  if (n < 2) return "1–2 yrs"
  if (n < 3) return "2–3 yrs"
  if (n < 5) return "3–5 yrs"
  return "5+ yrs"
}

export function mapTrackerRows(rows: Record<string, string>[], fallbackDate = new Date()): ImportedApplication[] {
  const out: ImportedApplication[] = []
  const seen = new Set<string>()
  let lastDate = fallbackDate.toISOString().slice(0, 10)

  for (const row of rows) {
    if (DATE.test(row.date ?? "")) lastDate = row.date
    const status = (row.status ?? "").trim().toLowerCase()
    const company = (row.company ?? row.companyname ?? "").trim()
    const role = (row.role ?? row.roletitle ?? "").trim()
    if (!company || !role || company.length > 100) continue
    if (!APPLIED_STATUSES.has(status) && !STATUS_MAP[status]) continue

    const { portal, channel } = normalisePortal(row.portal ?? "")
    const externalKey = stableKey(company, role, portal)
    if (seen.has(externalKey)) continue
    seen.add(externalKey)

    out.push({
      externalKey,
      applicationDate: new Date(lastDate),
      companyName: company,
      roleTitle: role.slice(0, 100),
      portal,
      channel,
      status: STATUS_MAP[status] ?? "APPLIED",
    })
  }
  return out
}

export function mapMarketRows(rows: Record<string, string>[]): ImportedSignal[] {
  const out: ImportedSignal[] = []
  for (const row of rows) {
    const role = (row.role ?? "").trim()
    if (!DATE.test(row.date ?? "") || !role) continue
    const company = (row.company ?? "").trim().slice(0, 100) || null
    const listed = (row.skills ?? "").split(/[;|]/).map((s) => s.trim()).filter(Boolean)
    const skills = listed.length ? normaliseSkills(listed) : detectSkills(role)
    const decision = (row.decision ?? "").toLowerCase().startsWith("appl") ? "APPLIED" : "SKIPPED"
    out.push({
      externalKey: stableKey("m", row.id ?? "", row.date, company ?? "", role),
      date: new Date(row.date),
      portal: normalisePortal(row.portal ?? "").portal,
      company,
      roleTitle: role.slice(0, 150),
      expBand: row.exp_band || expBandFrom(row.exp_min),
      decision,
      blocker: (row.blocker || (decision === "APPLIED" ? "None (applied)" : "Other")).slice(0, 40),
      skills,
    })
  }
  return out
}
