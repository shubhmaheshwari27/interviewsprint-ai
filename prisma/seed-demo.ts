/**
 * Loads the public, read-only demo account with real (anonymised) job-hunt
 * data from prisma/demo/*.json. Runs on every build and is idempotent: rows
 * are keyed by `externalKey`, so re-running only adds what is new.
 *
 * A failure here never fails the build: the app works without the demo data.
 */
import { PrismaClient, type ApplicationStatus, type ApplicationChannel } from "@prisma/client"
import bcrypt from "bcryptjs"
import { readFileSync } from "node:fs"
import { join } from "node:path"

const DEMO_EMAIL = process.env.NEXT_PUBLIC_DEMO_EMAIL || "demo@interviewsprint.dev"
const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_PASSWORD || "demo-sprint-2026"
const DEMO_SKILLS = ["JavaScript", "TypeScript", "React", "Next.js", "Node.js", "Express", "Java", "SQL", "MongoDB",
  "AWS", "Docker", "CI/CD", "Microservices", "GenAI/LLM", "REST APIs", "HTML/CSS"]

type DemoApplication = {
  externalKey: string; date: string; companyName: string; roleTitle: string
  portal: string; channel: ApplicationChannel; status: ApplicationStatus
}
type DemoSignal = {
  externalKey: string; date: string; portal: string; company: string | null; roleTitle: string
  expBand: string; decision: string; blocker: string; skills: string[]
}

const read = <T,>(file: string): T => JSON.parse(readFileSync(join(__dirname, "demo", file), "utf8"))

// A couple of richer examples so the application detail and AI prep pages have something to show.
const SAMPLE_DETAILS: Record<string, { jobDescription: string; techStack: string; rounds?: { name: string; type: "PHONE" | "HR" | "TECHNICAL"; outcome: "PASSED" | "PENDING" }[] }> = {
  "hyphenedge software": {
    techStack: "React, JavaScript, REST APIs, Java, Spring Boot",
    jobDescription:
      "We are hiring a React.js Developer (0-2 years) in Noida. You will build responsive UIs in React and JavaScript, " +
      "integrate REST APIs exposed by our Java / Spring Boot backend, write clean reusable components, and work with Git " +
      "in an Agile team. Basic Python is a plus.",
    rounds: [
      { name: "Recruiter phone screen", type: "PHONE", outcome: "PASSED" },
      { name: "Technical interview", type: "TECHNICAL", outcome: "PENDING" },
    ],
  },
  "nextastra technologies": {
    techStack: "MongoDB, Express, React, Node.js",
    jobDescription:
      "Jr. MERN Stack Developer, full-time from our Pune office. Build features end to end with MongoDB, Express, " +
      "React and Node.js, write REST APIs, and collaborate with designers and QA. Freshers and 0-2 years welcome.",
    rounds: [{ name: "Applicant details form", type: "HR", outcome: "PASSED" }],
  },
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.log("[seed-demo] DATABASE_URL not set - skipping.")
    return
  }
  const prisma = new PrismaClient()
  try {
    const password = await bcrypt.hash(DEMO_PASSWORD, 10)
    const user = await prisma.user.upsert({
      where: { email: DEMO_EMAIL },
      update: { isDemo: true, password, skills: DEMO_SKILLS, name: "Demo · Shubh's job hunt" },
      create: { email: DEMO_EMAIL, name: "Demo · Shubh's job hunt", password, isDemo: true, skills: DEMO_SKILLS },
    })

    // The demo shows only real imported data: drop the made-up samples the old seed created.
    await prisma.application.deleteMany({ where: { userId: user.id, source: { not: "IMPORT" } } })

    const applications = read<DemoApplication[]>("applications.json")
    const created = await prisma.application.createMany({
      skipDuplicates: true,
      data: applications.map((a) => {
        const extra = SAMPLE_DETAILS[a.companyName.toLowerCase()]
        return {
          userId: user.id,
          externalKey: a.externalKey,
          companyName: a.companyName,
          roleTitle: a.roleTitle,
          portal: a.portal,
          channel: a.channel,
          status: a.status,
          applicationDate: new Date(a.date),
          source: "IMPORT",
          jobDescription: extra?.jobDescription,
          techStack: extra?.techStack,
        }
      }),
    })

    // Interview rounds for the sample applications (only once).
    for (const [company, extra] of Object.entries(SAMPLE_DETAILS)) {
      if (!extra.rounds) continue
      const app = await prisma.application.findFirst({
        where: { userId: user.id, companyName: { equals: company, mode: "insensitive" } },
        include: { interviewRounds: true },
      })
      if (app && app.interviewRounds.length === 0) {
        await prisma.interviewRound.createMany({ data: extra.rounds.map((r) => ({ ...r, applicationId: app.id })) })
      }
    }

    const signals = read<DemoSignal[]>("market.json")
    const createdSignals = await prisma.marketSignal.createMany({
      skipDuplicates: true,
      data: signals.map((s) => ({ ...s, userId: user.id, date: new Date(s.date) })),
    })

    console.log(`[seed-demo] ${DEMO_EMAIL}: +${created.count} applications, +${createdSignals.count} market signals`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.warn("[seed-demo] skipped because of an error (the build continues):", error?.message ?? error)
})
