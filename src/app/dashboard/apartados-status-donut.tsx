"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const STATUS_LABEL: Record<string, string> = {
  ACTIVO: "Activo",
  SALDADO: "Saldado",
  CANCELADO: "Cancelado",
};

const STATUS_COLOR: Record<string, string> = {
  ACTIVO: "var(--color-accent)",
  SALDADO: "var(--color-success)",
  CANCELADO: "var(--color-danger)",
};

type Slice = { status: string; count: number };

export function ApartadosStatusDonut({ data }: { data: Slice[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <div className="flex items-center gap-4">
      <div className="h-[160px] w-[160px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="status"
              innerRadius={48}
              outerRadius={72}
              paddingAngle={total > 1 ? 2 : 0}
              stroke="var(--color-panel)"
              strokeWidth={2}
              isAnimationActive={false}
            >
              {data.map((d) => (
                <Cell key={d.status} fill={STATUS_COLOR[d.status] ?? "var(--color-ink-faint)"} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, _name, entry) => {
                const status = (entry as { payload?: { status?: string } })?.payload?.status ?? "";
                return [Number(value), STATUS_LABEL[status] ?? status];
              }}
              contentStyle={{
                background: "var(--color-panel)",
                border: "1px solid var(--color-line)",
                borderRadius: 8,
                fontSize: 12,
                color: "var(--color-ink)",
                boxShadow: "var(--shadow-panel)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {data.map((d) => (
          <div key={d.status} className="flex items-center justify-between gap-2 text-sm">
            <span className="flex items-center gap-2 text-[var(--color-ink-soft)]">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: STATUS_COLOR[d.status] ?? "var(--color-ink-faint)" }}
              />
              {STATUS_LABEL[d.status] ?? d.status}
            </span>
            <span className="font-semibold text-[var(--color-ink)]" style={{ fontVariantNumeric: "tabular-nums" }}>
              {d.count}
            </span>
          </div>
        ))}
        {total === 0 && (
          <p className="text-xs text-[var(--color-ink-faint)]">Sin apartados registrados</p>
        )}
      </div>
    </div>
  );
}
