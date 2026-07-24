"use client";

import { useState } from "react";
import { enviarFacturaEmail, getInvoicePDFUrl } from "./actions";

type Invoice = {
  id: string;
  numero: number;
  pdfUrl: string;
  status: string;
  enviadaContadoraEn: Date | null;
  createdAt: Date;
  sucursal: { nombre: string };
  sale: { total: { toString: () => string }; cliente: { nombre: string } | null };
};

type Props = { invoices: Invoice[] };

export function FacturacionClient({ invoices }: Props) {
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);

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

  async function handleView(id: string) {
    const result = await getInvoicePDFUrl(id);
    if (typeof result === "string") {
      window.open(result, "_blank");
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
              <tr key={inv.id} className="border-b border-[var(--color-line)] last:border-0">
                <td className="px-4 py-3 font-semibold text-[var(--color-ink)]">{inv.numero}</td>
                <td className="px-4 py-3 text-[var(--color-ink-soft)]">{inv.sucursal.nombre}</td>
                <td className="px-4 py-3 text-[var(--color-ink-soft)]">{inv.sale.cliente?.nombre ?? "\u2014"}</td>
                <td className="px-4 py-3 font-semibold text-[var(--color-ink)]" style={{ fontVariantNumeric: "tabular-nums" }}>
                  ${Number(inv.sale.total).toLocaleString("es-CO")}
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
                  <button onClick={() => handleView(inv.id)}
                    className="rounded-[8px] border border-[var(--color-line)] bg-[var(--color-panel-raised)] px-3 py-1 text-xs font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
                    PDF
                  </button>
                  <button onClick={() => handleSend(inv.id)} disabled={sendingId === inv.id}
                    className="rounded-[8px] border border-[var(--color-line)] bg-[var(--color-panel-raised)] px-3 py-1 text-xs font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] disabled:opacity-50">
                    {sendingId === inv.id ? "Enviando\u2026" : inv.enviadaContadoraEn ? "Reenviar" : "Enviar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
