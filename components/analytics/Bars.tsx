import { cn } from "@/lib/utils"

/** Simple labelled horizontal bars (server-rendered, no chart library needed). */
export function Bars({
  rows,
  max,
  suffix,
  highlight,
}: {
  rows: { label: string; value: number; hint?: string }[]
  max?: number
  suffix?: string
  highlight?: (label: string) => boolean
}) {
  const top = max ?? Math.max(1, ...rows.map((r) => r.value))
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="font-medium text-slate-800 dark:text-slate-200">{r.label}</span>
            <span className="tabular-nums text-muted-foreground">
              {r.value}
              {suffix}
              {r.hint ? <span className="ml-2 text-xs">{r.hint}</span> : null}
            </span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className={cn("h-full rounded-full", highlight?.(r.label) ? "bg-emerald-500" : "bg-primary")}
              style={{ width: `${Math.max(2, (r.value / top) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

export function EngineBadge({ engine }: { engine: { name: string; note?: string } }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-800 px-3 py-1 text-xs text-muted-foreground"
      title={engine.note}
    >
      <span className={cn("h-2 w-2 rounded-full", engine.name === "java-service" ? "bg-emerald-500" : "bg-sky-500")} />
      {engine.name === "java-service" ? "Computed by the Java analytics service" : "Computed in the app"}
      {engine.note ? " · service fallback" : ""}
    </span>
  )
}

export function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums text-slate-900 dark:text-white">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}
