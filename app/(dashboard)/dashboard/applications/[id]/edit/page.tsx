import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { ApplicationForm } from "@/components/applications/ApplicationForm"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

interface EditApplicationPageProps {
  params: Promise<{ id: string }>
}

export default async function EditApplicationPage({ params }: EditApplicationPageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const { id } = await params

  const application = await prisma.application.findUnique({
    where: { id, userId: session.user.id }
  })

  if (!application) notFound()

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-4">
          <Link href={`/dashboard/applications/${id}`}>
            <ChevronLeft className="mr-2 h-4 w-4" /> Back to Details
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Edit Application</h1>
        <p className="text-muted-foreground">
          Update the details for your application at {application.companyName}.
        </p>
      </div>
      
      <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <ApplicationForm mode="edit" initialData={application} />
      </div>
    </div>
  )
}
