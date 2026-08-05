"use client";

import { useActionState, useState } from "react";
import Modal from "@/components/modal";
import { formatCOP } from "@/lib/money";
import { registrarAbono } from "../apartados/actions";
import { registrarAbonoVenta } from "./actions";

type Apartado = {
  id: string;
  saldoPendiente: { toString: () => string };
  valorTotal: { toString: () => string };
  createdAt: Date;
  cliente: { id: string; nombre: string; telefono: string | null };
  product: { nombre: string; modelo: string | null };
};

type Venta = {
  id: string;
  saldoPendiente: { toString: () => string };
  total: { toString: () => string };
  createdAt: Date;
  cliente: { id: string; nombre: string; telefono: string | null } | null;
  sucursal: { nombre: string };
  items: { cantidad: number; product: { nombre: string; modelo: string | null } }[];
};

const METODOS_PAGO = [
  { value: "EFECTIVO", label: "Efectivo" },
  { value: "TRANSFERENCIA", label: "Transferencia" },
  { value: "TARJETA", label: "Tarjeta" },
] as const;

const inputClass = "w-full rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none";
const inputStyle = { boxShadow: "var(--shadow-inset)" };

type Props = {
  apartados: Apartado[];
  ventas: Venta[];
  userId: string;
  isAdmin: boolean;
  readOnly: boolean;
};

export function CarteraClient({ apartados, ventas, userId, isAdmin, readOnly }: Props) {
  const [tab, setTab] = useState<"apartados" | "ventas">(apartados.length > 0 ? "apartados" : "ventas");
  const [abonoApartado, setAbonoApartado] = useState<Apartado | null>(null);
  const [abonoVenta, setAbonoVenta] = useState<Venta | null>(null);

  const totalPendienteApartados = apartados.reduce((s, a) => s + Number(a.saldoPendiente), 0);
  const totalPendienteVentas = ventas.reduce((s, v) => s + Number(v.saldoPendiente), 0);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-[var(--color-ink)]">Cartera</h1>
          <p className="text-sm text-[var(--color-ink-soft)]">
            {formatCOP(totalPendienteApartados + totalPendienteVentas)} en cuentas por cobrar
          </p>
        </div>
        <div className="flex gap-1 rounded-[10px] bg-[var(--color-panel-raised)] p-1">
          <button onClick={() => setTab("apartados")}
            className={`rounded-[8px] px-3 py-1.5 text-xs font-semibold transition-colors ${tab === "apartados" ? "bg-[var(--color-panel)] text-[var(--color-ink)] shadow-sm" : "text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"}`}>
            Apartados ({apartados.length})
          </button>
          <button onClick={() => setTab("ventas")}
            className={`rounded-[8px] px-3 py-1.5 text-xs font-semibold transition-colors ${tab === "ventas" ? "bg-[var(--color-panel)] text-[var(--color-ink)] shadow-sm" : "text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"}`}>
            Ventas a crédito ({ventas.length})
          </button>
        </div>
      </div>

      {tab === "apartados" && (
        <div className="space-y-3">
          {apartados.length === 0 && (
            <div className="animate-fade-in-up rounded-[14px] border border-[var(--color-line)] bg-[var(--color-panel)] p-8 text-center"
              style={{ boxShadow: "var(--shadow-panel)" }}>
              <p className="text-[var(--color-ink-soft)]">No hay apartados con saldo pendiente</p>
            </div>
          )}
          {apartados.map((a) => (
            <div key={a.id} className="animate-fade-in-up flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-[var(--color-line)] bg-[var(--color-panel)] p-4"
              style={{ boxShadow: "var(--shadow-panel)" }}>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-sm font-semibold text-[var(--color-ink)]">{a.cliente.nombre}</span>
                  {a.cliente.telefono && <span className="text-xs text-[var(--color-ink-faint)]">{a.cliente.telefono}</span>}
                </div>
                <p className="text-xs text-[var(--color-ink-soft)]">{a.product.nombre}{a.product.modelo ? ` ${a.product.modelo}` : ""}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[var(--color-ink-faint)]">Total {formatCOP(a.valorTotal)}</p>
                <p className="text-sm font-bold text-[var(--color-danger)]">{formatCOP(a.saldoPendiente)}</p>
              </div>
              {!readOnly && (
                <button onClick={() => setAbonoApartado(a)}
                  className="shrink-0 rounded-[8px] border border-[var(--color-line)] bg-[var(--color-panel-raised)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
                  Abono
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "ventas" && (
        <div className="space-y-3">
          {ventas.length === 0 && (
            <div className="animate-fade-in-up rounded-[14px] border border-[var(--color-line)] bg-[var(--color-panel)] p-8 text-center"
              style={{ boxShadow: "var(--shadow-panel)" }}>
              <p className="text-[var(--color-ink-soft)]">No hay ventas a crédito con saldo pendiente</p>
            </div>
          )}
          {ventas.map((v) => (
            <div key={v.id} className="animate-fade-in-up flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-[var(--color-line)] bg-[var(--color-panel)] p-4"
              style={{ boxShadow: "var(--shadow-panel)" }}>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-sm font-semibold text-[var(--color-ink)]">{v.cliente?.nombre ?? "Consumidor final"}</span>
                  {isAdmin && <span className="text-xs text-[var(--color-ink-faint)]">{v.sucursal.nombre}</span>}
                </div>
                <p className="truncate text-xs text-[var(--color-ink-soft)]">
                  {v.items.map((i) => `${i.product.nombre}${i.cantidad > 1 ? ` ×${i.cantidad}` : ""}`).join(", ")}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[var(--color-ink-faint)]">Total {formatCOP(v.total)}</p>
                <p className="text-sm font-bold text-[var(--color-danger)]">{formatCOP(v.saldoPendiente)}</p>
              </div>
              {!readOnly && (
                <button onClick={() => setAbonoVenta(v)}
                  className="shrink-0 rounded-[8px] border border-[var(--color-line)] bg-[var(--color-panel-raised)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
                  Abono
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {abonoApartado && (
        <AbonoApartadoModal apartado={abonoApartado} userId={userId} onClose={() => setAbonoApartado(null)} />
      )}
      {abonoVenta && (
        <AbonoVentaModal venta={abonoVenta} userId={userId} onClose={() => setAbonoVenta(null)} />
      )}
    </>
  );
}

function AbonoApartadoModal({ apartado, userId, onClose }: { apartado: Apartado; userId: string; onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(async (_prev: unknown, fd: FormData) => {
    fd.set("apartadoId", apartado.id);
    fd.set("userId", userId);
    const result = await registrarAbono(fd);
    if (result && "success" in result && result.success) onClose();
    return result;
  }, undefined);

  const error = state && "error" in state ? state.error : undefined;

  return (
    <Modal open title={`Abono — ${apartado.cliente.nombre}`} onClose={onClose}>
      <form action={formAction} className="flex flex-col gap-3">
        <p className="text-sm text-[var(--color-ink-soft)]">
          Saldo pendiente: <strong className="text-[var(--color-danger)]">{formatCOP(apartado.saldoPendiente)}</strong>
        </p>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Monto</label>
          <input name="monto" type="number" min="1" max={Number(apartado.saldoPendiente)} required
            className={inputClass} style={inputStyle} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Método de pago</label>
          <select name="metodoPago" defaultValue="EFECTIVO" className={inputClass} style={inputStyle}>
            {METODOS_PAGO.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        {error && <p className="rounded-lg bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]">{error}</p>}
        <button type="submit" disabled={isPending}
          className="mt-2 rounded-[12px] border-none py-2.5 text-sm font-semibold text-white disabled:opacity-50 btn-skeu-primary">
          {isPending ? "Guardando…" : "Registrar abono"}
        </button>
      </form>
    </Modal>
  );
}

function AbonoVentaModal({ venta, userId, onClose }: { venta: Venta; userId: string; onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(async (_prev: unknown, fd: FormData) => {
    fd.set("saleId", venta.id);
    fd.set("userId", userId);
    const result = await registrarAbonoVenta(fd);
    if (result && "success" in result && result.success) onClose();
    return result;
  }, undefined);

  const error = state && "error" in state ? state.error : undefined;

  return (
    <Modal open title={`Abono — ${venta.cliente?.nombre ?? "Consumidor final"}`} onClose={onClose}>
      <form action={formAction} className="flex flex-col gap-3">
        <p className="text-sm text-[var(--color-ink-soft)]">
          Saldo pendiente: <strong className="text-[var(--color-danger)]">{formatCOP(venta.saldoPendiente)}</strong>
        </p>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Monto</label>
          <input name="monto" type="number" min="1" max={Number(venta.saldoPendiente)} required
            className={inputClass} style={inputStyle} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Método de pago</label>
          <select name="metodoPago" defaultValue="EFECTIVO" className={inputClass} style={inputStyle}>
            {METODOS_PAGO.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        {error && <p className="rounded-lg bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]">{error}</p>}
        <button type="submit" disabled={isPending}
          className="mt-2 rounded-[12px] border-none py-2.5 text-sm font-semibold text-white disabled:opacity-50 btn-skeu-primary">
          {isPending ? "Guardando…" : "Registrar abono"}
        </button>
      </form>
    </Modal>
  );
}
