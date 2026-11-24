import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const DEMO_READ_ONLY_MESSAGE =
  "This is the read-only demo account. Create your own account to add or change data."

export type SessionUser = { id: string; isDemo: boolean; skills: string[] }

/** Current signed-in user with the flags the server actions need, or null. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth()
  const id = session?.user?.id
  if (!id) return null
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, isDemo: true, skills: true },
  })
  return user
}

/**
 * For mutating actions: returns the user id, or an error message when the user
 * is signed out or is the read-only demo account.
 */
export async function requireWritableUser(): Promise<{ id: string } | { error: string }> {
  const user = await getSessionUser()
  if (!user) return { error: "Unauthorized" }
  if (user.isDemo) return { error: DEMO_READ_ONLY_MESSAGE }
  return { id: user.id }
}
