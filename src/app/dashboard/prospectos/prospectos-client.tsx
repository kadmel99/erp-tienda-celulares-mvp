"use client";

import { useRef } from "react";
import { formatCOP } from "@/lib/money";

type Prospecto = {
  id: string;
  nombre: string | null;
  telefono: string | null;
  correo: string | null;
  productoInteres: string | null;
  presupuesto: { toString: () => string } | null;
  origen: string;
  createdAt: Date;
  sucursal: { nombre: string } | null;
};

type Props = {
  prospectos: Prospecto[];
  sucursales: { id: string; nombre: string }[];
  isAdmin: boolean;
  qrDataUrl: string | null;
  sucursalNombre: string | null;
};

export function ProspectosClient({ prospectos, isAdmin, qrDataUrl, sucursalNombre }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  function downloadCSV() {
    const header = "Nombre,Tel\u00e9fono,Correo,Producto,Presupuesto,Origen,Fecha,Sucursal\n";
    const rows = prospectos.map((p) =>
      [
        p.nombre ?? "",
        p.telefono ?? "",
        p.correo ?? "",
        p.productoInteres ?? "",
        p.presupuesto ? Number(p.presupuesto).toString() : "",
        p.origen,
        new Date(p.createdAt).toLocaleDateString("es-CO"),
        p.sucursal?.nombre ?? "",
      ].map((v) => `"${v.replace(/"/g, '""')}"`).join(",")
    ).join("\n");
    const blob = new Blob(["\ufeff" + header + rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prospectos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-[var(--color-ink)]">Prospectos</h1>
          <p className="text-sm text-[var(--color-ink-soft)]">{prospectos.length} registros</p>
        </div>
        {prospectos.length > 0 && (
          <button onClick={downloadCSV}
            className="rounded-[12px] border border-[var(--color-line)] bg-[var(--color-panel-raised)] px-4 py-2 text-sm font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
            Exportar CSV
          </button>
        )}
      </div>

      {qrDataUrl && (
        <div className="mb-6 rounded-[14px] border border-[var(--color-line)] bg-[var(--color-panel)] p-4 text-center"
          style={{ boxShadow: "var(--shadow-panel)" }}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
            QR de captura — {sucursalNombre}
          </p>
          <img src={qrDataUrl} alt="QR" className="mx-auto h-32 w-32" />
          <p className="mt-2 text-xs text-[var(--color-ink-faint)]">
            Imprime este c&oacute;digo para capturar prospectos
          </p>
        </div>
      )}

      <div className="overflow-hidden rounded-[14px] border border-[var(--color-line)] bg-[var(--color-panel)]"
        style={{ boxShadow: "var(--shadow-panel)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-line)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Tel&eacute;fono</th>
              <th className="px-4 py-3">Correo</th>
              <th className="px-4 py-3">Producto inter&eacute;s</th>
              <th className="px-4 py-3">Presupuesto</th>
              <th className="px-4 py-3">Origen</th>
              <th className="px-4 py-3">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {prospectos.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-[var(--color-ink-faint)]">
                  No hay prospectos capturados
                </td>
              </tr>
            )}
            {prospectos.map((p) => (
              <tr key={p.id} className="border-b border-[var(--color-line)] last:border-0">
                <td className="px-4 py-3 font-medium text-[var(--color-ink)]">{p.nombre ?? "\u2014"}</td>
                <td className="px-4 py-3 text-[var(--color-ink-soft)]">{p.telefono ?? "\u2014"}</td>
                <td className="px-4 py-3 text-[var(--color-ink-soft)]">{p.correo ?? "\u2014"}</td>
                <td className="px-4 py-3 text-[var(--color-ink-soft)]">{p.productoInteres ?? "\u2014"}</td>
                <td className="px-4 py-3 text-[var(--color-ink)]" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {p.presupuesto ? formatCOP(p.presupuesto) : "\u2014"}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-[var(--color-accent-soft)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-accent-deep)]">
                    {p.origen}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-[var(--color-ink-faint)]">
                  {new Date(p.createdAt).toLocaleDateString("es-CO")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
