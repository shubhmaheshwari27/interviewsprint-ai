"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { encryptSecret, decryptSecret, keyHint } from "@/lib/crypto"
import { PROVIDERS, PROVIDER_IDS, testProviderKey, type ProviderId } from "@/lib/ai/providers"
import { requireWritableUser } from "@/lib/session-user"
import type { ActionResult } from "@/types/actions"

const SaveSchema = z.object({
  provider: z.enum(PROVIDER_IDS as [ProviderId, ...ProviderId[]]),
  apiKey: z.string().trim().max(400).optional().default(""),
  model: z.string().trim().min(1).max(80).regex(/^[\w.\-:/]+$/, "Invalid model name"),
})

/** Add a key, or replace the key / model of an existing one. The key is tested before it is saved. */
export async function saveAIKey(formData: FormData): Promise<ActionResult<{ status: string }>> {
  const writable = await requireWritableUser()
  if ("error" in writable) return { success: false, error: writable.error }

  const parsed = SaveSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }
  const { provider, apiKey, model } = parsed.data

  const existing = await prisma.aIProviderKey.findUnique({ where: { userId_provider: { userId: writable.id, provider } } })
  if (!apiKey && !existing) return { success: false, error: "Paste your API key." }

  // Only the model changed: keep the stored key.
  if (!apiKey && existing) {
    await prisma.aIProviderKey.update({ where: { id: existing.id }, data: { model } })
    revalidatePath("/dashboard/settings")
    return { success: true, data: { status: existing.lastStatus ?? "Saved" } }
  }

  const test = await testProviderKey(provider, apiKey)
  if (!test.ok) return { success: false, error: `${PROVIDERS[provider].label}: ${test.message}` }

  const count = await prisma.aIProviderKey.count({ where: { userId: writable.id } })
  const data = {
    encryptedKey: encryptSecret(apiKey),
    keyHint: keyHint(apiKey),
    model,
    lastStatus: "Connected",
    lastTestedAt: new Date(),
  }
  await prisma.aIProviderKey.upsert({
    where: { userId_provider: { userId: writable.id, provider } },
    update: data,
    create: { ...data, userId: writable.id, provider, priority: count },
  })
  revalidatePath("/dashboard/settings")
  return { success: true, data: { status: "Connected" } }
}

export async function testAIKey(id: string): Promise<ActionResult<{ status: string }>> {
  const writable = await requireWritableUser()
  if ("error" in writable) return { success: false, error: writable.error }
  const key = await prisma.aIProviderKey.findFirst({ where: { id, userId: writable.id } })
  if (!key) return { success: false, error: "Key not found." }

  let result: { ok: boolean; message: string }
  try {
    result = await testProviderKey(key.provider as ProviderId, decryptSecret(key.encryptedKey))
  } catch {
    result = { ok: false, message: "The stored key can't be read any more. Please paste it again." }
  }
  await prisma.aIProviderKey.update({ where: { id }, data: { lastStatus: result.message, lastTestedAt: new Date() } })
  revalidatePath("/dashboard/settings")
  return result.ok ? { success: true, data: { status: result.message } } : { success: false, error: result.message }
}

export async function deleteAIKey(id: string): Promise<ActionResult<void>> {
  const writable = await requireWritableUser()
  if ("error" in writable) return { success: false, error: writable.error }
  await prisma.aIProviderKey.deleteMany({ where: { id, userId: writable.id } })
  revalidatePath("/dashboard/settings")
  return { success: true }
}

/** Move a provider one step up or down in the fallback order. */
export async function moveAIKey(id: string, direction: "up" | "down"): Promise<ActionResult<void>> {
  const writable = await requireWritableUser()
  if ("error" in writable) return { success: false, error: writable.error }
  const keys = await prisma.aIProviderKey.findMany({ where: { userId: writable.id }, orderBy: { priority: "asc" } })
  const i = keys.findIndex((k) => k.id === id)
  const j = direction === "up" ? i - 1 : i + 1
  if (i < 0 || j < 0 || j >= keys.length) return { success: true }
  ;[keys[i], keys[j]] = [keys[j], keys[i]]
  await prisma.$transaction(keys.map((k, priority) => prisma.aIProviderKey.update({ where: { id: k.id }, data: { priority } })))
  revalidatePath("/dashboard/settings")
  return { success: true }
}
