"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts"

interface StatusChartProps {
  data: Array<{ status: string; count: number }>
}

const STATUS_COLORS: Record<string, string> = {
  APPLIED: "#3b82f6",     // blue
  SCREENING: "#f59e0b",   // amber
  INTERVIEWING: "#8b5cf6", // violet
  OFFER: "#10b981",       // emerald
  REJECTED: "#f43f5e",    // rose
  WITHDRAWN: "#64748b",   // slate
}

export function StatusChart({ data }: StatusChartProps) {
  if (data.length === 0) {
    return (
      <Card className="col-span-4 lg:col-span-2 shadow-sm border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Status Distribution</CardTitle>
          <CardDescription>Visual breakdown of your application stages</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground italic bg-slate-50/50 dark:bg-slate-900/50 m-6 rounded-xl border border-dashed">
          No data available to visualize
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="col-span-4 lg:col-span-2 shadow-sm border-slate-200 dark:border-slate-800">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Status Distribution</CardTitle>
        <CardDescription>Visual breakdown of your application stages</CardDescription>
      </CardHeader>
      <CardContent className="h-[350px] pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
              dataKey="status" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 12 }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 12 }}
            />
            <Tooltip 
              cursor={{ fill: 'rgba(226, 232, 240, 0.4)' }}
              contentStyle={{ 
                borderRadius: '12px', 
                border: '1px solid #e2e8f0',
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                fontSize: '14px',
                fontWeight: '500'
              }}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={40}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || "#64748b"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
