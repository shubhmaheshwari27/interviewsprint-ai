"use client"

import { useState, useTransition } from "react"
import { Copy, Download, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export type TokenRow = { id: string; name: string; prefix: string; createdAt: string; lastUsedAt: string | null }

import { createApiToken, revokeApiToken } from "@/actions/api-tokens"

export function ExtensionTokens({ tokens, disabled }: { tokens: TokenRow[]; disabled?: boolean }) {
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState("Chrome on my laptop")
  const [fresh, setFresh] = useState<string | null>(null)

  function onCreate() {
    const data = new FormData()
    data.set("name", name)
    startTransition(async () => {
      const r = await createApiToken(data)
      if (r.success) {
        setFresh(r.data.token)
        toast.success("Token created. Copy it now: it won't be shown again.")
      } else toast.error(r.error)
    })
  }

  return (
    <div className="space-y-5">
      <ol className="list-decimal pl-5 text-sm text-muted-foreground space-y-1">
        <li>
          Download the extension and load it in Chrome (chrome://extensions → Developer mode → Load unpacked).
        </li>
        <li>Create a token below and paste it into the extension once.</li>
        <li>On any job page, click the extension icon, check the details, and save.</li>
      </ol>
      <Button asChild variant="outline">
        <a href="/interviewsprint-extension.zip" download>
          <Download className="mr-2 h-4 w-4" /> Download the extension (.zip)
        </a>
      </Button>

      <div className="flex flex-col sm:flex-row gap-3">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Token name" disabled={disabled} />
        <Button onClick={onCreate} disabled={disabled || isPending} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" /> Create token
        </Button>
      </div>

      {fresh && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-900/20 p-4 space-y-2">
          <p className="text-sm font-medium">Copy this token now. For your security it is shown only once.</p>
          <div className="flex gap-2">
            <code className="flex-1 break-all rounded bg-white dark:bg-slate-900 px-3 py-2 text-sm">{fresh}</code>
            <Button
              size="icon"
              variant="outline"
              onClick={() => navigator.clipboard.writeText(fresh).then(() => toast.success("Copied."))}
              title="Copy"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {tokens.length > 0 && (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800">
          {tokens.map((t) => (
            <li key={t.id} className="flex items-center gap-3 p-3 text-sm">
              <div className="flex-1">
                <p className="font-medium">{t.name}</p>
                <p className="text-xs text-muted-foreground">
                  {t.prefix}… · created {new Date(t.createdAt).toLocaleDateString()} ·{" "}
                  {t.lastUsedAt ? `last used ${new Date(t.lastUsedAt).toLocaleString()}` : "never used"}
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                disabled={disabled || isPending}
                onClick={() =>
                  startTransition(async () => {
                    const r = await revokeApiToken(t.id)
                    r.success ? toast.success("Token revoked.") : toast.error(r.error)
                  })
                }
                title="Revoke"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
