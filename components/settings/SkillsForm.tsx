"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { updateSkills } from "@/actions/import"

export function SkillsForm({ initialSkills }: { initialSkills: string[] }) {
  const [value, setValue] = useState(initialSkills.join(", "))
  const [skills, setSkills] = useState(initialSkills)
  const [isPending, startTransition] = useTransition()

  function onSave() {
    const data = new FormData()
    data.set("skills", value)
    startTransition(async () => {
      const result = await updateSkills(data)
      if (result.success) {
        setSkills(result.data.skills)
        setValue(result.data.skills.join(", "))
        toast.success("Skills saved.")
      } else toast.error(result.error)
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="React, Node.js, TypeScript, Java, SQL" />
        <Button onClick={onSave} disabled={isPending} className="shrink-0">
          {isPending ? "Saving…" : "Save skills"}
        </Button>
      </div>
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {skills.map((s) => (
            <Badge key={s} variant="secondary">{s}</Badge>
          ))}
        </div>
      )}
    </div>
  )
}
