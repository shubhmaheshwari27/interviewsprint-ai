"use client"

import { useState, useTransition } from "react"
import { ArrowDown, ArrowUp, ExternalLink, KeyRound, RefreshCw, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { saveAIKey, testAIKey, deleteAIKey, moveAIKey } from "@/actions/ai-keys"

export type ProviderInfo = {
  id: "GOOGLE" | "OPENAI" | "ANTHROPIC"
  label: string
  keyUrl: string
  defaultModel: string
  models: { id: string; label: string }[]
  note: string
}

export type StoredKey = {
  id: string
  provider: ProviderInfo["id"]
  keyHint: string
  model: string
  lastStatus: string | null
  lastTestedAt: string | null
}

export function AIProviders({ providers, keys, disabled }: { providers: ProviderInfo[]; keys: StoredKey[]; disabled?: boolean }) {
  const [isPending, startTransition] = useTransition()
  const [provider, setProvider] = useState<ProviderInfo["id"]>(providers[0].id)
  const [apiKey, setApiKey] = useState("")
  const [model, setModel] = useState(providers[0].defaultModel)

  const selected = providers.find((p) => p.id === provider)!
  const existing = keys.find((k) => k.provider === provider)

  function pickProvider(id: ProviderInfo["id"]) {
    setProvider(id)
    const p = providers.find((x) => x.id === id)!
    setModel(keys.find((k) => k.provider === id)?.model ?? p.defaultModel)
    setApiKey("")
  }

  function run(action: () => Promise<{ success: boolean; error?: string }>, ok: string) {
    startTransition(async () => {
      const result = await action()
      if (result.success) toast.success(ok)
      else toast.error(result.error ?? "Something went wrong.")
    })
  }

  function onSave() {
    const data = new FormData()
    data.set("provider", provider)
    data.set("apiKey", apiKey)
    data.set("model", model)
    run(async () => {
      const r = await saveAIKey(data)
      if (r.success) setApiKey("")
      return r
    }, existing && !apiKey ? "Model updated." : "Key tested and saved.")
  }

  return (
    <div className="space-y-6">
      {keys.length > 0 && (
        <div className="space-y-2">
          <Label className="text-base">Fallback order</Label>
          <p className="text-sm text-muted-foreground">
            Tried top to bottom. If all fail, the app uses its offline analysis, so AI prep never breaks.
          </p>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800">
            {keys.map((k, i) => {
              const p = providers.find((x) => x.id === k.provider)!
              const healthy = k.lastStatus === "Connected" || k.lastStatus === "Working"
              return (
                <li key={k.id} className="flex flex-wrap items-center gap-3 p-3">
                  <span className="w-5 text-sm tabular-nums text-muted-foreground">{i + 1}.</span>
                  <div className="flex-1 min-w-[180px]">
                    <p className="font-medium">{p.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {k.model} · key {k.keyHint}
                    </p>
                  </div>
                  <Badge variant={healthy ? "secondary" : "destructive"} title={k.lastTestedAt ?? undefined}>
                    {k.lastStatus ?? "Not tested"}
                  </Badge>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" disabled={disabled || isPending || i === 0} onClick={() => run(() => moveAIKey(k.id, "up"), "Order updated.")} title="Move up">
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" disabled={disabled || isPending || i === keys.length - 1} onClick={() => run(() => moveAIKey(k.id, "down"), "Order updated.")} title="Move down">
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" disabled={disabled || isPending} onClick={() => run(() => testAIKey(k.id), "Key works.")} title="Test key">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" disabled={disabled || isPending} onClick={() => run(() => deleteAIKey(k.id), "Key deleted.")} title="Delete key">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <div className="space-y-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-4">
        <div className="flex flex-wrap gap-2">
          {providers.map((p) => (
            <Button key={p.id} size="sm" variant={p.id === provider ? "default" : "outline"} onClick={() => pickProvider(p.id)}>
              {p.label}
            </Button>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          {selected.note}{" "}
          <a href={selected.keyUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary underline">
            Get a key <ExternalLink className="h-3 w-3" />
          </a>
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="ai-key">API key {existing ? `(saved ${existing.keyHint}; leave empty to keep it)` : ""}</Label>
            <Input id="ai-key" type="password" autoComplete="off" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Paste your key" disabled={disabled} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ai-model">Model</Label>
            <Input id="ai-model" list="ai-models" value={model} onChange={(e) => setModel(e.target.value)} disabled={disabled} />
            <datalist id="ai-models">
              {selected.models.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </datalist>
          </div>
        </div>
        <Button onClick={onSave} disabled={disabled || isPending || (!apiKey && !existing)}>
          <KeyRound className="mr-2 h-4 w-4" />
          {isPending ? "Checking…" : existing && !apiKey ? "Update model" : "Test & save key"}
        </Button>
        <p className="text-xs text-muted-foreground">
          Keys are encrypted (AES-256-GCM) before they are stored and are never sent back to your browser. Usage is billed to
          your own provider account.
        </p>
      </div>
    </div>
  )
}
