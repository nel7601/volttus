"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"

interface ChartProps {
  data: Array<{ timestamp: string; value: number }>
}

export function ConsumptionChart({ data }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="timestamp"
          tick={{ fontSize: 11 }}
          interval="preserveStartEnd"
        />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#f97316"
          fill="#fed7aa"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
