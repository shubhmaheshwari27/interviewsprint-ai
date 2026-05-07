"use client"

import dynamic from "next/dynamic"

const StatusChart = dynamic(() => import("./StatusChart").then(mod => mod.StatusChart), {
  ssr: false,
  loading: () => <div className="col-span-4 lg:col-span-2 h-[400px] bg-slate-100 dark:bg-slate-900 animate-pulse rounded-xl" />
})

interface ChartWrapperProps {
  data: Array<{ status: string; count: number }>
}

export function ChartWrapper({ data }: ChartWrapperProps) {
  return <StatusChart data={data} />
}
