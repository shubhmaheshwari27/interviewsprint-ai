"use server"

import { prisma } from "@/lib/prisma"
import { parseCsv } from "@/lib/csv"
import { mapMarketRows, mapTrackerRows } from "@/lib/import"
import { requireWritableUser } from "@/lib/session-user"
import { normaliseSkills } from "@/lib/skills"
import { revalidatePath } from "next/cache"
import type { ActionResult } from "@/types/actions"

const MAX_BYTES = 2 * 1024 * 1024

/** Import a tracker CSV (applications) or a market CSV (screened jobs + skills). Re-imports are idempotent. */
export async function importJobHuntCsv(formData: FormData): Promise<ActionResult<{ added: number; skipped: number }>> {
  const writable = await requireWritableUser()
  if ("error" in writable) return { success: false, error: writable.error }

  const kind = formData.get("kind")
  const file = formData.get("file")
  if (!(file instanceof File) || file.size === 0) return { success: false, error: "Choose a CSV file first." }
  if (file.size > MAX_BYTES) return { success: false, error: "The file is larger than 2 MB." }

  try {
    const rows = parseCsv(await file.text())
    if (kind === "market") {
      const signals = mapMarketRows(rows)
      const result = await prisma.marketSignal.createMany({
        skipDuplicates: true,
        data: signals.map((s) => ({ ...s, userId: writable.id })),
      })
      revalidatePath("/dashboard/market")
      return { success: true, data: { added: result.count, skipped: rows.length - result.count } }
    }

    const applications = mapTrackerRows(rows)
    const result = await prisma.application.createMany({
      skipDuplicates: true,
      data: applications.map((a) => ({ ...a, userId: writable.id, source: "IMPORT" })),
    })
    revalidatePath("/dashboard")
    revalidatePath("/dashboard/applications")
    revalidatePath("/dashboard/analytics")
    return { success: true, data: { added: result.count, skipped: rows.length - result.count } }
  } catch (error) {
    console.error("CSV import failed:", error)
    return { success: false, error: "Could not read that CSV. Check the column names and try again." }
  }
}

/** Save the user's own skills (comma separated), used for skill-gap analysis. */
export async function updateSkills(formData: FormData): Promise<ActionResult<{ skills: string[] }>> {
  const writable = await requireWritableUser()
  if ("error" in writable) return { success: false, error: writable.error }
  const raw = String(formData.get("skills") ?? "")
  const skills = normaliseSkills(raw.split(",")).slice(0, 60)
  await prisma.user.update({ where: { id: writable.id }, data: { skills } })
  revalidatePath("/dashboard/market")
  revalidatePath("/dashboard/settings")
  return { success: true, data: { skills } }
}
