"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

type Point = { mes: string; ventas: number; costo: number };

function money(n: number) {
  return `$${n.toLocaleString("es-CO", { maximumFractionDigits: 0 })}`;
}

export function VentasCostoChart({ data }: { data: Point[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }} barCategoryGap="24%" barGap={2}>
        <CartesianGrid vertical={false} stroke="var(--color-line)" />
        <XAxis
          dataKey="mes"
          tickLine={false}
          axisLine={{ stroke: "var(--color-line)" }}
          tick={{ fill: "var(--color-ink-soft)", fontSize: 11 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fill: "var(--color-ink-soft)", fontSize: 11 }}
          tickFormatter={(v: number) => money(v)}
          width={70}
        />
        <Tooltip
          formatter={(value, name) => [money(Number(value)), name === "ventas" ? "Ventas" : "Costo"]}
          contentStyle={{
            background: "var(--color-panel)",
            border: "1px solid var(--color-line)",
            borderRadius: 8,
            fontSize: 12,
            color: "var(--color-ink)",
            boxShadow: "var(--shadow-panel)",
          }}
        />
        <Legend
          formatter={(value: string) => (
            <span style={{ color: "var(--color-ink-soft)", fontSize: 12 }}>
              {value === "ventas" ? "Ventas" : "Costo"}
            </span>
          )}
        />
        <Bar dataKey="ventas" name="ventas" fill="var(--color-accent)" radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false} />
        <Bar dataKey="costo" name="costo" fill="var(--color-ink-soft)" radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}
