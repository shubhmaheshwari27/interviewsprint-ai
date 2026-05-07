import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { ApplicationList } from "@/components/applications/ApplicationList"
import { ApplicationFilters } from "@/components/applications/ApplicationFilters"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"
import { Prisma } from "@prisma/client"

interface ApplicationsPageProps {
  searchParams: Promise<{
    q?: string
    status?: string
    sort?: string
  }>
}

export default async function ApplicationsPage({ searchParams }: ApplicationsPageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const { q, status, sort } = await searchParams

  // Build Prisma where clause
  const where: Prisma.ApplicationWhereInput = {
    userId: session.user.id,
    ...(q && {
      OR: [
        { companyName: { contains: q, mode: "insensitive" } },
        { roleTitle: { contains: q, mode: "insensitive" } },
      ],
    }),
    ...(status && status !== "ALL" && { status: status as any }),
  }

  // Build Prisma orderBy clause
  let orderBy: Prisma.ApplicationOrderByWithRelationInput = { createdAt: "desc" }
  if (sort === "oldest") orderBy = { createdAt: "asc" }
  if (sort === "company_az") orderBy = { companyName: "asc" }
  if (sort === "company_za") orderBy = { companyName: "desc" }

  const applications = await prisma.application.findMany({
    where,
    orderBy,
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Applications</h1>
          <p className="text-muted-foreground">
            Manage and track all your job applications in one place.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/applications/new">
            <Plus className="mr-2 h-4 w-4" /> Add Application
          </Link>
        </Button>
      </div>

      <ApplicationFilters />
      
      <ApplicationList applications={applications} />
    </div>
  )
}
