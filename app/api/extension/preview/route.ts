import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { authenticateToken, corsHeaders, json } from "@/lib/api-auth"
import { fitScore, jobExternalKey } from "@/lib/extension-jobs"

export const dynamic = "force-dynamic"

const PreviewSchema = z.object({
  title: z.string().max(200).optional().default(""),
  description: z.string().max(10_000).optional().default(""),
  url: z.string().max(500).optional().default(""),
})

export function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) })
}

/** Fit score against the user's skills, and whether this job is already saved. */
export async function POST(request: Request) {
  const auth = await authenticateToken(request)
  if ("error" in auth) return json(request, { error: auth.error }, auth.status)

  const parsed = PreviewSchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) return json(request, { error: "Invalid request" }, 400)
  const { title, description, url } = parsed.data

  const existing = url
    ? await prisma.application.findUnique({
        where: { userId_externalKey: { userId: auth.user.id, externalKey: jobExternalKey(url) } },
        select: { id: true, status: true },
      })
    : null

  return json(request, {
    ...fitScore(`${title}\n${description}`, auth.user.skills),
    hasProfileSkills: auth.user.skills.length > 0,
    alreadySaved: existing ? { id: existing.id, status: existing.status } : null,
  })
}
