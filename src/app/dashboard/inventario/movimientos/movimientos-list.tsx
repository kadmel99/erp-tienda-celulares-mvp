"use client";

import { useActionState, useState } from "react";
import Modal from "@/components/modal";
import { createMovement } from "./actions";

type Movement = {
  id: string;
  tipo: string;
  cantidad: number;
  motivo: string | null;
  userId: string;
  createdAt: Date;
  product: { id: string; nombre: string; sku: string };
};

type Props = {
  movements: Movement[];
  products: { id: string; nombre: string; sku: string }[];
  userId: string;
  productoSeleccionado: { id: string; nombre: string; sku: string } | null;
};

export function MovimientosList({ movements, products, userId, productoSeleccionado }: Props) {
  const [creando, setCreando] = useState(false);

  const tipoStyles: Record<string, string> = {
    ENTRADA: "bg-[var(--color-success-soft)] text-[var(--color-success)]",
    SALIDA: "bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
    AJUSTE: "bg-[var(--color-accent-soft)] text-[var(--color-accent-deep)]",
    TRASLADO: "bg-[var(--color-panel-raised)] text-[var(--color-ink-soft)]",
  };

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-[var(--color-ink)]">Movimientos de inventario</h1>
          {productoSeleccionado && (
            <p className="text-sm text-[var(--color-ink-soft)]">
              Filtrado por: {productoSeleccionado.nombre} ({productoSeleccionado.sku})
            </p>
          )}
        </div>
        <button
          onClick={() => setCreando(true)}
          className="rounded-[12px] border-none px-4 py-2 text-sm font-semibold text-white"
          style={{
            background: "linear-gradient(180deg, var(--color-accent-hi), var(--color-accent) 55%, var(--color-accent-deep))",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4), 0 3px 0 var(--color-accent-deep), 0 6px 14px rgba(20,101,117,0.35)",
          }}
        >
          Nuevo movimiento
        </button>
      </div>

      <div className="overflow-hidden rounded-[14px] border border-[var(--color-line)] bg-[var(--color-panel)]"
        style={{ boxShadow: "var(--shadow-panel)" }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-line)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Cantidad</th>
              <th className="px-4 py-3">Motivo</th>
              <th className="px-4 py-3">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {movements.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[var(--color-ink-faint)]">
                  No hay movimientos registrados
                </td>
              </tr>
            )}
            {movements.map((m) => (
              <tr key={m.id} className="border-b border-[var(--color-line)] last:border-0">
                <td className="px-4 py-3">
                  <div className="font-medium text-[var(--color-ink)]">{m.product.nombre}</div>
                  <div className="text-xs text-[var(--color-ink-faint)]">{m.product.sku}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${tipoStyles[m.tipo] ?? ""}`}>
                    {m.tipo}
                  </span>
                </td>
                <td className="px-4 py-3 font-semibold text-[var(--color-ink)]">{m.cantidad}</td>
                <td className="px-4 py-3 text-sm text-[var(--color-ink-soft)]">{m.motivo ?? "\u2014"}</td>
                <td className="px-4 py-3 text-xs text-[var(--color-ink-faint)]">
                  {new Date(m.createdAt).toLocaleDateString("es-CO", {
                    day: "2-digit", month: "2-digit", year: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {creando && (
        <MovimientoFormModal title="Nuevo movimiento" products={products}
          userId={userId} productoPreseleccionado={productoSeleccionado}
          onClose={() => setCreando(false)} />
      )}
    </>
  );
}

function MovimientoFormModal({ title, products, userId, productoPreseleccionado, onClose }: {
  title: string;
  products: { id: string; nombre: string; sku: string }[];
  userId: string;
  productoPreseleccionado: { id: string; nombre: string; sku: string } | null;
  onClose: () => void;
}) {
  const action = createMovement;
  const [state, formAction, isPending] = useActionState(async (_prev: unknown, fd: FormData) => {
    fd.set("userId", userId);
    const result = await action(fd);
    if (result && "success" in result && result.success) onClose();
    return result;
  }, undefined);

  const error = state && "error" in state ? state.error : undefined;

  return (
    <Modal open title={title} onClose={onClose}>
      <form action={formAction} className="flex flex-col gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Producto</label>
          <select name="productId" required defaultValue={productoPreseleccionado?.id ?? ""}
            className="w-full rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
            style={{ boxShadow: "var(--shadow-inset)" }}>
            <option value="">Seleccionar producto</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.nombre} ({p.sku})</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Tipo</label>
          <select name="tipo" required
            className="w-full rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
            style={{ boxShadow: "var(--shadow-inset)" }}>
            <option value="ENTRADA">Entrada</option>
            <option value="SALIDA">Salida</option>
            <option value="AJUSTE">Ajuste</option>
            <option value="TRASLADO">Traslado</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Cantidad</label>
          <input name="cantidad" type="number" min="1" defaultValue="1"
            className="w-full rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
            style={{ boxShadow: "var(--shadow-inset)" }} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Motivo</label>
          <textarea name="motivo" rows={2}
            className="w-full rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none resize-none"
            style={{ boxShadow: "var(--shadow-inset)" }} />
        </div>
        {error && <p className="rounded-lg bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]">{error}</p>}
        <button type="submit" disabled={isPending}
          className="mt-2 rounded-[12px] border-none py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          style={{
            background: "linear-gradient(180deg, var(--color-accent-hi), var(--color-accent) 55%, var(--color-accent-deep))",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4), 0 3px 0 var(--color-accent-deep), 0 6px 14px rgba(20,101,117,0.35)",
          }}>
          {isPending ? "Guardando\u2026" : "Registrar"}
        </button>
      </form>
    </Modal>
  );
}
