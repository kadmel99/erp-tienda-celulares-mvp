"use client";

import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";

type Point = { date: string; value: number };

export function Sparkline({ data }: { data: Point[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 4, right: 2, bottom: 2, left: 2 }}>
        <defs>
          <linearGradient id="sparklineFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Tooltip
          cursor={false}
          formatter={(value) => [`$${Number(value).toLocaleString("es-CO", { minimumFractionDigits: 2 })}`, "Ventas"]}
          labelFormatter={(label) => new Date(String(label)).toLocaleDateString("es-CO", { day: "2-digit", month: "short" })}
          contentStyle={{
            background: "var(--color-panel)",
            border: "1px solid var(--color-line)",
            borderRadius: 8,
            fontSize: 11,
            color: "var(--color-ink)",
            boxShadow: "var(--shadow-panel)",
          }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="var(--color-accent)"
          strokeWidth={2}
          fill="url(#sparklineFill)"
          dot={false}
          activeDot={{ r: 3, fill: "var(--color-accent)", stroke: "var(--color-panel)", strokeWidth: 1.5 }}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
