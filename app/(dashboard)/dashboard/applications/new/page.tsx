import { ApplicationForm } from "@/components/applications/ApplicationForm"

export default function NewApplicationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Add Application</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Enter the details of the job you applied for.
        </p>
      </div>
      <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <ApplicationForm mode="create" />
      </div>
    </div>
  )
}
