import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const password = await bcrypt.hash("password123", 10)

  const user = await prisma.user.upsert({
    where: { email: "demo@interviewsprint.dev" },
    update: {},
    create: {
      email: "demo@interviewsprint.dev",
      name: "Demo User",
      password,
      applications: {
        create: [
          {
            companyName: "Stripe",
            roleTitle: "Senior Software Engineer",
            status: "INTERVIEWING",
            applicationDate: new Date("2024-01-15"),
            techStack: "React, Node.js, TypeScript, PostgreSQL",
            jobDescription: "We are looking for a senior engineer...",
            notes: "Applied via referral from John.",
          },
          {
            companyName: "Vercel",
            roleTitle: "Frontend Engineer",
            status: "APPLIED",
            applicationDate: new Date("2024-01-20"),
            techStack: "Next.js, React, TypeScript",
          },
        ],
      },
    },
  })

  console.log("Seed complete:", user.email)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
