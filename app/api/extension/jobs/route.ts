import { prisma } from "@/lib/prisma"
import { authenticateToken, corsHeaders, json } from "@/lib/api-auth"
import { ExtensionJobSchema, jobExternalKey, portalFromUrl } from "@/lib/extension-jobs"
import { detectSkills } from "@/lib/skills"
import { runAnalysis } from "@/lib/ai/run"

export const dynamic = "force-dynamic"
export const maxDuration = 60 // optional AI prep after saving

export function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) })
}

/**
 * Save (or update) the job the user is viewing. Idempotent per job URL: saving
 * the same posting again updates it instead of creating a duplicate.
 */
export async function POST(request: Request) {
  const auth = await authenticateToken(request)
  if ("error" in auth) return json(request, { error: auth.error }, auth.status)

  const parsed = ExtensionJobSchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) return json(request, { error: parsed.error.issues[0]?.message ?? "Invalid job" }, 400)
  const job = parsed.data
  const externalKey = jobExternalKey(job.url)

  const fields = {
    companyName: job.company,
    roleTitle: job.title,
    jobDescription: job.description || null,
    location: job.location || null,
    jobUrl: job.url,
    portal: portalFromUrl(job.url, job.portal),
    salaryRange: job.salary || null,
    techStack: detectSkills(`${job.title}\n${job.description}`).join(", ").slice(0, 500) || null,
  }

  const existing = await prisma.application.findUnique({
    where: { userId_externalKey: { userId: auth.user.id, externalKey } },
    select: { id: true, status: true },
  })

  const application = existing
    ? await prisma.application.update({
        where: { id: existing.id },
        // Never move a job backwards (e.g. from Interviewing to Saved).
        data: { ...fields, ...(existing.status === "SAVED" && job.status === "APPLIED" ? { status: "APPLIED", applicationDate: new Date() } : {}) },
        select: { id: true, status: true },
      })
    : await prisma.application.create({
        data: {
          ...fields,
          userId: auth.user.id,
          externalKey,
          status: job.status,
          channel: "PORTAL",
          source: "EXTENSION",
          applicationDate: new Date(),
        },
        select: { id: true, status: true },
      })

  let analysis: { source: string; degradedReason?: string } | null = null
  if (job.analyze && job.description) {
    const result = await runAnalysis(auth.user, application.id)
    if (result.ok) analysis = { source: result.data.source, degradedReason: result.data.degradedReason }
  }

  const origin = new URL(request.url).origin
  return json(
    request,
    {
      id: application.id,
      status: application.status,
      created: !existing,
      url: `${origin}/dashboard/applications/${application.id}`,
      analysis,
    },
    existing ? 200 : 201
  )
}
