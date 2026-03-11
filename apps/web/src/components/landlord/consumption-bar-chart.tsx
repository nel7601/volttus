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
  INCOME: "#0ea5e9",
  COMMON: "#f59e0b",
  APARTMENT: "#10b981",
}

export function ConsumptionBarChart({ data }: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data} barCategoryGap="20%">
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: "#6b7280" }}
          axisLine={{ stroke: "#e5e7eb" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#6b7280" }}
          unit=" kWh"
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(value) => [
            `${Number(value).toFixed(3)} kWh`,
            "Consumption",
          ]}
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid #e0f2fe",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
          }}
        />
        <Bar dataKey="kwh" radius={[6, 6, 0, 0]} maxBarSize={60}>
          {data.map((entry, index) => (
            <Cell key={index} fill={COLORS[entry.type] ?? "#94a3b8"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
