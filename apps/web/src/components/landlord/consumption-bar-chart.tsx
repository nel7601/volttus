"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts"

interface BarChartProps {
  data: Array<{ name: string; kwh: number; type: string }>
}

const COLORS: Record<string, string> = {
  INCOME: "#f97316",
  COMMON: "#6366f1",
  APARTMENT: "#22c55e",
}

export function ConsumptionBarChart({ data }: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} unit=" kWh" />
        <Tooltip
          formatter={(value) => [`${Number(value).toFixed(3)} kWh`, "Consumption"]}
        />
        <Bar dataKey="kwh" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={index} fill={COLORS[entry.type] ?? "#94a3b8"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
