"use client";

import { useActionState, useState } from "react";
import Modal from "@/components/modal";
import { createWarranty, updateWarrantyStatus } from "./actions";

type Warranty = {
  id: string;
  clienteId: string;
  motivo: string;
  diagnostico: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  product: { id: string; nombre: string; modelo: string | null; sku: string };
};

type Product = { id: string; nombre: string; modelo: string | null; sku: string };

type Props = { warranties: Warranty[]; products: Product[]; userId: string };

const STATUS_FLOW = [
  { value: "RECIBIDO", label: "Recibido", color: "bg-[var(--color-accent-soft)] text-[var(--color-accent-deep)]" },
  { value: "EN_REVISION", label: "En revisi\u00f3n", color: "bg-[var(--color-accent-soft)] text-[var(--color-accent-deep)]" },
  { value: "EN_REPARACION", label: "En reparaci\u00f3n", color: "bg-[var(--color-accent-soft)] text-[var(--color-accent-deep)]" },
  { value: "ENVIADO_PROVEEDOR", label: "Enviado proveedor", color: "bg-[var(--color-accent-soft)] text-[var(--color-accent-deep)]" },
  { value: "APROBADO", label: "Aprobado", color: "bg-[var(--color-success-soft)] text-[var(--color-success)]" },
  { value: "RECHAZADO", label: "Rechazado", color: "bg-[var(--color-danger-soft)] text-[var(--color-danger)]" },
  { value: "ENTREGADO", label: "Entregado", color: "bg-[var(--color-success-soft)] text-[var(--color-success)]" },
];

const STATUS_STYLES: Record<string, string> = {};
STATUS_FLOW.forEach((s) => { STATUS_STYLES[s.value] = s.color; });

export function GarantiasClient({ warranties, products, userId }: Props) {
  const [creando, setCreando] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-[var(--color-ink)]">Garant&iacute;as</h1>
        <button onClick={() => setCreando(true)}
          className="rounded-[12px] border-none px-4 py-2 text-sm font-semibold text-white"
          style={{
            background: "linear-gradient(180deg, var(--color-accent-hi), var(--color-accent) 55%, var(--color-accent-deep))",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4), 0 3px 0 var(--color-accent-deep), 0 6px 14px rgba(20,101,117,0.35)",
          }}>
          Nueva garant&iacute;a
        </button>
      </div>

      <div className="space-y-3">
        {warranties.length === 0 && (
          <div className="rounded-[14px] border border-[var(--color-line)] bg-[var(--color-panel)] p-8 text-center"
            style={{ boxShadow: "var(--shadow-panel)" }}>
            <p className="text-[var(--color-ink-soft)]">No hay solicitudes de garant&iacute;a</p>
          </div>
        )}
        {warranties.map((w) => (
          <div key={w.id}
            className="rounded-[14px] border border-[var(--color-line)] bg-[var(--color-panel)] p-4"
            style={{ boxShadow: "var(--shadow-panel)" }}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-sm font-semibold text-[var(--color-ink)]">{w.product.nombre}{w.product.modelo ? ` ${w.product.modelo}` : ""}</span>
                  <span className="text-xs text-[var(--color-ink-faint)]">{w.product.sku}</span>
                </div>
                <p className="text-xs text-[var(--color-ink-soft)]">Cliente ID: {w.clienteId}</p>
                <p className="mt-1 text-sm text-[var(--color-ink)]">{w.motivo}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[w.status] ?? ""}`}>
                  {STATUS_FLOW.find((s) => s.value === w.status)?.label ?? w.status}
                </span>
                <button onClick={() => setExpanded(expanded === w.id ? null : w.id)}
                  className="rounded-[8px] border border-[var(--color-line)] bg-[var(--color-panel-raised)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
                  {expanded === w.id ? "Cerrar" : "Detalle"}
                </button>
              </div>
            </div>

            {expanded === w.id && (
              <div className="mt-4 border-t border-[var(--color-line)] pt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Cambiar estado</p>
                <div className="flex flex-wrap gap-2">
                  {STATUS_FLOW.map((s) => (
                    <button key={s.value}
                      onClick={async () => { await updateWarrantyStatus(w.id, s.value); }}
                      disabled={w.status === s.value}
                      className={`rounded-[8px] border px-3 py-1.5 text-xs font-medium disabled:opacity-50 ${
                        w.status === s.value
                          ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent-deep)]"
                          : "border-[var(--color-line)] bg-[var(--color-panel-raised)] text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
                      }`}>
                      {s.label}
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-xs text-[var(--color-ink-faint)]">
                  Creado: {new Date(w.createdAt).toLocaleDateString("es-CO")}
                  {w.updatedAt && ` · Actualizado: ${new Date(w.updatedAt).toLocaleDateString("es-CO")}`}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {creando && (
        <CrearGarantiaModal onClose={() => setCreando(false)} products={products} userId={userId} />
      )}
    </>
  );
}

function CrearGarantiaModal({ onClose, products, userId }: {
  onClose: () => void; products: Product[]; userId: string;
}) {
  const [state, formAction, isPending] = useActionState(async (_prev: unknown, fd: FormData) => {
    fd.set("userId", userId);
    const result = await createWarranty(fd);
    if (result && "success" in result && result.success) onClose();
    return result;
  }, undefined);

  const error = state && "error" in state ? state.error : undefined;

  return (
    <Modal open title="Nueva garant&iacute;a" onClose={onClose}>
      <form action={formAction} className="flex flex-col gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Producto</label>
          <select name="productId" required
            className="w-full rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
            style={{ boxShadow: "var(--shadow-inset)" }}>
            <option value="">Seleccionar producto</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.nombre}{p.modelo ? ` ${p.modelo}` : ""} ({p.sku})</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">ID del cliente</label>
          <input name="clienteId" required
            className="w-full rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
            style={{ boxShadow: "var(--shadow-inset)" }} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Motivo</label>
          <textarea name="motivo" required rows={3}
            className="w-full resize-none rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
            style={{ boxShadow: "var(--shadow-inset)" }} />
        </div>
        {error && <p className="rounded-lg bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]">{error}</p>}
        <button type="submit" disabled={isPending}
          className="mt-2 rounded-[12px] border-none py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          style={{
            background: "linear-gradient(180deg, var(--color-accent-hi), var(--color-accent) 55%, var(--color-accent-deep))",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4), 0 3px 0 var(--color-accent-deep), 0 6px 14px rgba(20,101,117,0.35)",
          }}>
          {isPending ? "Creando\u2026" : "Crear"}
        </button>
      </form>
    </Modal>
  );
}
