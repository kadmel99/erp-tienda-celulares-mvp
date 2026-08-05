"use client";

import { Fragment, useActionState, useState } from "react";
import Modal from "@/components/modal";
import { enviarFacturaEmail, getInvoicePDFUrl, devolverItem } from "./actions";
import { formatCOP } from "@/lib/money";
import { openPdfDataUrl } from "@/lib/open-pdf";

type SaleItem = {
  id: string;
  cantidad: number;
  precioUnit: { toString: () => string };
  product: { nombre: string; modelo: string | null };
  devoluciones: { cantidad: number }[];
};

type Invoice = {
  id: string;
  numero: number;
  pdfUrl: string;
  status: string;
  enviadaContadoraEn: Date | null;
  createdAt: Date;
  sucursal: { nombre: string };
  sale: { total: { toString: () => string }; cliente: { nombre: string } | null; items: SaleItem[] };
};

type Props = { invoices: Invoice[]; readOnly?: boolean; userId: string };

export function FacturacionClient({ invoices, readOnly = false, userId }: Props) {
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [devolverTarget, setDevolverTarget] = useState<{ item: SaleItem; saleId: string; numero: number } | null>(null);

  async function handleSend(id: string) {
    setSendingId(id);
    setMsg(null);
    const result = await enviarFacturaEmail(id);
    if (result && "error" in result) {
      setMsg({ text: result.error as string, error: true });
    } else {
      setMsg({ text: "Factura enviada a la contadora" });
    }
    setSendingId(null);
  }

  async function handleView(id: string, numero: number) {
    const result = await getInvoicePDFUrl(id);
    if (typeof result === "string") {
      openPdfDataUrl(result, `factura-${numero}.pdf`);
    } else if (result && "error" in result) {
      setMsg({ text: result.error as string, error: true });
    }
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-[var(--color-ink)]">Facturaci&oacute;n</h1>
        <p className="text-sm text-[var(--color-ink-soft)]">{invoices.length} facturas</p>
      </div>

      {msg && (
        <div className={`mb-4 rounded-lg px-4 py-2 text-sm ${msg.error ? "bg-[var(--color-danger-soft)] text-[var(--color-danger)]" : "bg-[var(--color-success-soft)] text-[var(--color-success)]"}`}>
          {msg.text}
        </div>
      )}

      <div className="overflow-hidden rounded-[14px] border border-[var(--color-line)] bg-[var(--color-panel)]"
        style={{ boxShadow: "var(--shadow-panel)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-line)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Sucursal</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-[var(--color-ink-faint)]">
                  No hay facturas generadas
                </td>
              </tr>
            )}
            {invoices.map((inv) => (
              <Fragment key={inv.id}>
                <tr className="border-b border-[var(--color-line)] last:border-0">
                  <td className="px-4 py-3 font-semibold text-[var(--color-ink)]">{inv.numero}</td>
                  <td className="px-4 py-3 text-[var(--color-ink-soft)]">{inv.sucursal.nombre}</td>
                  <td className="px-4 py-3 text-[var(--color-ink-soft)]">{inv.sale.cliente?.nombre ?? "—"}</td>
                  <td className="px-4 py-3 font-semibold text-[var(--color-ink)]" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {formatCOP(inv.sale.total)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      inv.status === "EMITIDA"
                        ? "bg-[var(--color-success-soft)] text-[var(--color-success)]"
                        : "bg-[var(--color-danger-soft)] text-[var(--color-danger)]"
                    }`}>
                      {inv.status === "EMITIDA" ? "Emitida" : "Anulada"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--color-ink-faint)]">
                    {new Date(inv.createdAt).toLocaleDateString("es-CO")}
                  </td>
                  <td className="flex gap-2 px-4 py-3">
                    <button onClick={() => handleView(inv.id, inv.numero)}
                      className="rounded-[8px] border border-[var(--color-line)] bg-[var(--color-panel-raised)] px-3 py-1 text-xs font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
                      PDF
                    </button>
                    {!readOnly && (
                      <button onClick={() => handleSend(inv.id)} disabled={sendingId === inv.id}
                        className="rounded-[8px] border border-[var(--color-line)] bg-[var(--color-panel-raised)] px-3 py-1 text-xs font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] disabled:opacity-50">
                        {sendingId === inv.id ? "Enviando…" : inv.enviadaContadoraEn ? "Reenviar" : "Enviar"}
                      </button>
                    )}
                    <button onClick={() => setExpandedId(expandedId === inv.id ? null : inv.id)}
                      className="rounded-[8px] border border-[var(--color-line)] bg-[var(--color-panel-raised)] px-3 py-1 text-xs font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
                      {expandedId === inv.id ? "Cerrar" : "Detalle"}
                    </button>
                  </td>
                </tr>
                {expandedId === inv.id && (
                  <tr className="animate-fade-in border-b border-[var(--color-line)] bg-[var(--color-panel-raised)]">
                    <td colSpan={7} className="px-4 py-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Productos</p>
                      <div className="flex flex-col gap-1.5">
                        {inv.sale.items.map((item) => {
                          const devuelto = item.devoluciones.reduce((s, d) => s + d.cantidad, 0);
                          const disponible = item.cantidad - devuelto;
                          return (
                            <div key={item.id} className="flex items-center justify-between rounded-[8px] bg-[var(--color-panel)] px-3 py-2 text-xs">
                              <span className="text-[var(--color-ink)]">
                                {item.product.nombre}{item.product.modelo ? ` ${item.product.modelo}` : ""}
                                {" "}×{item.cantidad}
                                {devuelto > 0 && <span className="ml-2 text-[var(--color-danger)]">({devuelto} devuelta{devuelto > 1 ? "s" : ""})</span>}
                              </span>
                              {!readOnly && disponible > 0 && (
                                <button
                                  onClick={() => setDevolverTarget({ item, saleId: inv.id, numero: inv.numero })}
                                  className="shrink-0 text-xs font-semibold text-[var(--color-accent-deep)] hover:underline"
                                >
                                  Devolver
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {devolverTarget && (
        <DevolverModal
          item={devolverTarget.item}
          numero={devolverTarget.numero}
          userId={userId}
          onClose={() => setDevolverTarget(null)}
        />
      )}
    </>
  );
}

function DevolverModal({ item, numero, userId, onClose }: {
  item: SaleItem; numero: number; userId: string; onClose: () => void;
}) {
  const yaDevuelto = item.devoluciones.reduce((s, d) => s + d.cantidad, 0);
  const disponible = item.cantidad - yaDevuelto;
  const precioUnit = Number(item.precioUnit);

  const [cantidad, setCantidad] = useState(1);

  const [state, formAction, isPending] = useActionState(async (_prev: unknown, fd: FormData) => {
    fd.set("saleItemId", item.id);
    fd.set("userId", userId);
    const result = await devolverItem(fd);
    if (result && "success" in result && result.success) onClose();
    return result;
  }, undefined);

  const error = state && "error" in state ? state.error : undefined;

  return (
    <Modal open title={`Devolver — Factura #${numero}`} onClose={onClose}>
      <form action={formAction} className="flex flex-col gap-3">
        <p className="text-sm text-[var(--color-ink)]">
          {item.product.nombre}{item.product.modelo ? ` ${item.product.modelo}` : ""}
        </p>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
            Cantidad a devolver (máx. {disponible})
          </label>
          <input name="cantidad" type="number" min="1" max={disponible} required
            value={cantidad}
            onChange={(e) => setCantidad(Math.max(1, Math.min(disponible, Number(e.target.value) || 1)))}
            className="w-full rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
            style={{ boxShadow: "var(--shadow-inset)" }} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Motivo</label>
          <textarea name="motivo" required rows={2}
            className="w-full resize-none rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
            style={{ boxShadow: "var(--shadow-inset)" }} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
            Reembolso al cliente
          </label>
          <input name="reembolso" type="number" min="0"
            defaultValue={cantidad * precioUnit}
            key={cantidad}
            className="w-full rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
            style={{ boxShadow: "var(--shadow-inset)" }} />
          <p className="mt-1 text-xs text-[var(--color-ink-faint)]">
            Déjalo en 0 si es un cambio por otro producto en vez de un reembolso en efectivo. Si es mayor a 0, se descuenta de la caja abierta.
          </p>
        </div>
        {error && <p className="rounded-lg bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]">{error}</p>}
        <button type="submit" disabled={isPending}
          className="mt-2 rounded-[12px] border-none py-2.5 text-sm font-semibold text-white disabled:opacity-50 btn-skeu-primary">
          {isPending ? "Procesando…" : "Registrar devolución"}
        </button>
      </form>
    </Modal>
  );
}
