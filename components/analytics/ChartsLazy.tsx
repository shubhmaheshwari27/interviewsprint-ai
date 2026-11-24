"use client"

import dynamic from "next/dynamic"

const loading = () => <div className="h-[260px] rounded-xl bg-slate-100 dark:bg-slate-900 animate-pulse" />

export const PerDayChart = dynamic(() => import("./Charts").then((m) => m.PerDayChart), { ssr: false, loading })
export const PortalChart = dynamic(() => import("./Charts").then((m) => m.PortalChart), { ssr: false, loading })
