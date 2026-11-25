"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { newApiToken, sha256 } from "@/lib/crypto"
import { requireWritableUser } from "@/lib/session-user"
import type { ActionResult } from "@/types/actions"

const MAX_ACTIVE_TOKENS = 5

/** Create a personal access token for the browser extension. The plain token is returned only once. */
export async function createApiToken(formData: FormData): Promise<ActionResult<{ token: string }>> {
  const writable = await requireWritableUser()
  if ("error" in writable) return { success: false, error: writable.error }

  const name = String(formData.get("name") ?? "").trim().slice(0, 60) || "Chrome extension"
  const active = await prisma.apiToken.count({ where: { userId: writable.id, revokedAt: null } })
  if (active >= MAX_ACTIVE_TOKENS) return { success: false, error: `Revoke a token first (max ${MAX_ACTIVE_TOKENS}).` }

  const token = newApiToken()
  await prisma.apiToken.create({
    data: { userId: writable.id, name, tokenHash: sha256(token), prefix: token.slice(0, 10) },
  })
  revalidatePath("/dashboard/settings")
  return { success: true, data: { token } }
}

export async function revokeApiToken(id: string): Promise<ActionResult<void>> {
  const writable = await requireWritableUser()
  if ("error" in writable) return { success: false, error: writable.error }
  await prisma.apiToken.updateMany({ where: { id, userId: writable.id, revokedAt: null }, data: { revokedAt: new Date() } })
  revalidatePath("/dashboard/settings")
  return { success: true }
}
