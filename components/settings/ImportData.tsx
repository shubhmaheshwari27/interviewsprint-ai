"use client"

import { useRef, useState, useTransition } from "react"
import { Upload } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { importJobHuntCsv } from "@/actions/import"

function ImportRow({ kind, title, hint }: { kind: "tracker" | "market"; title: string; hint: string }) {
  const [isPending, startTransition] = useTransition()
  const [file, setFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function onImport() {
    if (!file) return toast.error("Choose a CSV file first.")
    const data = new FormData()
    data.set("kind", kind)
    data.set("file", file)
    startTransition(async () => {
      const result = await importJobHuntCsv(data)
      if (result.success) {
        toast.success(`Imported ${result.data.added} new rows (${result.data.skipped} skipped or already there).`)
        setFile(null)
        if (inputRef.current) inputRef.current.value = ""
      } else toast.error(result.error)
    })
  }

  return (
    <div className="space-y-2">
      <Label className="text-base">{title}</Label>
      <p className="text-sm text-muted-foreground">{hint}</p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Input ref={inputRef} type="file" accept=".csv,text/csv" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <Button onClick={onImport} disabled={isPending || !file} className="shrink-0">
          <Upload className="mr-2 h-4 w-4" /> {isPending ? "Importing…" : "Import"}
        </Button>
      </div>
    </div>
  )
}

export function ImportData() {
  return (
    <div className="space-y-6">
      <ImportRow
        kind="tracker"
        title="Applications CSV"
        hint="Columns: date, portal, company, role, status. Rows with status Applied / Emailed / Replied become applications. Safe to re-import."
      />
      <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
        <ImportRow
          kind="market"
          title="Market CSV (screened jobs)"
          hint="Columns: date, portal, company, role, exp_band, decision (Applied/Skipped), blocker, skills (separated by ;). Powers the Market Gap page."
        />
      </div>
    </div>
  )
}
