"use client";

import { useActionState, useState } from "react";
import Modal from "@/components/modal";
import { createApartado, registrarAbono, registrarSeguimiento } from "./actions";
import { formatCOP } from "@/lib/money";
import { NewClientModal } from "@/components/new-client-modal";

type Cliente = { id: string; nombre: string; telefono: string | null; correo: string | null };
type Producto = { id: string; nombre: string; modelo: string | null; sku: string; precioVenta: { toString: () => string }; sucursalId: string };
type Abono = { id: string; monto: { toString: () => string }; metodoPago: string; userId: string; createdAt: Date };
type Seguimiento = { id: string; nota: string; proximaAccion: Date | null; userId: string; createdAt: Date };
type Apartado = {
  id: string; sucursalId: string; clienteId: string; productId: string;
  valorTotal: { toString: () => string }; saldoPendiente: { toString: () => string };
  fechaLimite: Date | null; status: string; userId: string; createdAt: Date;
  cliente: Cliente; product: Producto;
  abonos: Abono[]; seguimientos: Seguimiento[];
};

type Props = {
  apartados: Apartado[];
  productos: Producto[];
  clientes: Cliente[];
  sucursalId: string;
  userId: string;
  readOnly?: boolean;
};

const METODOS_PAGO = [
  { value: "EFECTIVO", label: "Efectivo" },
  { value: "TRANSFERENCIA", label: "Transferencia" },
  { value: "TARJETA", label: "Tarjeta" },
] as const;

export function ApartadosClient({ apartados, productos, clientes, sucursalId, userId, readOnly = false }: Props) {
  const [tab, setTab] = useState<"activos" | "cartera">("activos");
  const [showCrear, setShowCrear] = useState(false);
  const [showAbono, setShowAbono] = useState<Apartado | null>(null);
  const [showSeguimiento, setShowSeguimiento] = useState<Apartado | null>(null);
  const [showDetail, setShowDetail] = useState<Apartado | null>(null);

  const activos = apartados.filter((a) => a.status === "ACTIVO");
  const cartera = apartados.filter((a) => a.status === "ACTIVO" && Number(a.saldoPendiente) > 0);

  const items = tab === "activos" ? activos : cartera;

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-[var(--color-ink)]">Apartados</h1>
          <div className="flex gap-1 rounded-[10px] bg-[var(--color-panel-raised)] p-1">
            <button onClick={() => setTab("activos")}
              className={`rounded-[8px] px-3 py-1.5 text-xs font-semibold transition-colors ${tab === "activos" ? "bg-[var(--color-panel)] text-[var(--color-ink)] shadow-sm" : "text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"}`}>
              Activos ({activos.length})
            </button>
            <button onClick={() => setTab("cartera")}
              className={`rounded-[8px] px-3 py-1.5 text-xs font-semibold transition-colors ${tab === "cartera" ? "bg-[var(--color-panel)] text-[var(--color-ink)] shadow-sm" : "text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"}`}>
              Cartera ({cartera.length})
            </button>
          </div>
        </div>
        {!readOnly && (
          <button onClick={() => setShowCrear(true)}
            className="rounded-[12px] border-none px-4 py-2 text-sm font-semibold text-white"
            style={{
              background: "linear-gradient(180deg, var(--color-accent-hi), var(--color-accent) 55%, var(--color-accent-deep))",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4), 0 3px 0 var(--color-accent-deep), 0 6px 14px rgba(20,101,117,0.35)",
            }}>
            Nuevo apartado
          </button>
        )}
      </div>

      <div className="space-y-3">
        {items.length === 0 && (
          <div className="rounded-[14px] border border-[var(--color-line)] bg-[var(--color-panel)] p-8 text-center"
            style={{ boxShadow: "var(--shadow-panel)" }}>
            <p className="text-[var(--color-ink-soft)]">
              No hay apartados {tab === "cartera" ? "en cartera" : "activos"}
            </p>
          </div>
        )}
        {items.map((a) => {
          const pct = Number(a.saldoPendiente) > 0
            ? Math.round((1 - Number(a.saldoPendiente) / Number(a.valorTotal)) * 100)
            : 100;
          const abonosTotal = a.abonos.reduce((s, ab) => s + Number(ab.monto), 0);

          return (
            <div key={a.id}
              className="rounded-[14px] border border-[var(--color-line)] bg-[var(--color-panel)] p-4"
              style={{ boxShadow: "var(--shadow-panel)" }}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-sm font-semibold text-[var(--color-ink)]">{a.cliente.nombre}</span>
                    <span className="text-xs text-[var(--color-ink-faint)]">{a.product.nombre}{a.product.modelo ? ` ${a.product.modelo}` : ""}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--color-ink-soft)]">
                    <span>Total: <strong className="text-[var(--color-ink)]">{formatCOP(a.valorTotal)}</strong></span>
                    <span>Pagado: <strong className="text-[var(--color-success)]">{formatCOP(abonosTotal)}</strong></span>
                    <span>Saldo: <strong className="text-[var(--color-danger)]">{formatCOP(a.saldoPendiente)}</strong></span>
                  </div>
                  <div className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-[var(--color-panel-raised)]">
                    <div className="h-full rounded-full bg-[var(--color-accent)] transition-all"
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  {!readOnly && a.status === "ACTIVO" && Number(a.saldoPendiente) > 0 && (
                    <button onClick={() => setShowAbono(a)}
                      className="rounded-[8px] border border-[var(--color-line)] bg-[var(--color-panel-raised)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
                      Abono
                    </button>
                  )}
                  <button onClick={() => setShowDetail(a.id === showDetail?.id ? null : a)}
                    className="rounded-[8px] border border-[var(--color-line)] bg-[var(--color-panel-raised)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
                    Detalle
                  </button>
                </div>
              </div>

              {showDetail?.id === a.id && (
                <div className="mt-4 border-t border-[var(--color-line)] pt-4">
                  {!readOnly && (
                    <div className="mb-3 flex gap-2">
                      <button onClick={() => { setShowSeguimiento(a); setShowDetail(null); }}
                        className="rounded-[8px] border border-[var(--color-line)] bg-[var(--color-panel-raised)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
                        + Seguimiento
                      </button>
                    </div>
                  )}
                  {a.abonos.length > 0 && (
                    <div className="mb-3">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Abonos</p>
                      {a.abonos.map((ab) => (
                        <div key={ab.id} className="flex justify-between text-xs text-[var(--color-ink)]">
                          <span>{formatCOP(ab.monto)} ({ab.metodoPago})</span>
                          <span className="text-[var(--color-ink-faint)]">
                            {new Date(ab.createdAt).toLocaleDateString("es-CO")}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {a.seguimientos.length > 0 && (
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Seguimientos</p>
                      {a.seguimientos.map((s) => (
                        <div key={s.id} className="mb-1 text-xs">
                          <p className="text-[var(--color-ink)]">{s.nota}</p>
                          {s.proximaAccion && <p className="text-[var(--color-ink-soft)]">Pr&oacute;xima acci&oacute;n: {new Date(s.proximaAccion).toLocaleDateString("es-CO")}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showCrear && (
        <CrearApartadoModal onClose={() => setShowCrear(false)}
          productos={productos} clientes={clientes} sucursalId={sucursalId} userId={userId} />
      )}
      {showAbono && (
        <AbonoModal apartado={showAbono} onClose={() => setShowAbono(null)} userId={userId} />
      )}
      {showSeguimiento && (
        <SeguimientoModal apartado={showSeguimiento} onClose={() => setShowSeguimiento(null)} userId={userId} />
      )}
    </>
  );
}

function CrearApartadoModal({ onClose, productos, clientes, sucursalId, userId }: {
  onClose: () => void; productos: Producto[]; clientes: Cliente[]; sucursalId: string; userId: string;
}) {
  const [state, formAction, isPending] = useActionState(async (_prev: unknown, fd: FormData) => {
    fd.set("sucursalId", sucursalId);
    fd.set("userId", userId);
    const result = await createApartado(fd);
    if (result && "success" in result && result.success) onClose();
    return result;
  }, undefined);

  const error = state && "error" in state ? state.error : undefined;
  const [productoId, setProductoId] = useState("");
  const selected = productos.find((p) => p.id === productoId);
  const valorTotal = selected ? Number(selected.precioVenta) : 0;
  const [clientesList, setClientesList] = useState(clientes);
  const [clienteId, setClienteId] = useState("");
  const [showNewClient, setShowNewClient] = useState(false);

  if (showNewClient) {
    return (
      <NewClientModal
        onClose={() => setShowNewClient(false)}
        onCreated={(c) => { setClientesList((prev) => [...prev, c]); setClienteId(c.id); setShowNewClient(false); }}
      />
    );
  }

  return (
    <Modal open title="Nuevo apartado" onClose={onClose}>
      <form action={formAction} className="flex flex-col gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Cliente</label>
          <div className="flex gap-2">
            <select name="clienteId" required value={clienteId} onChange={(e) => setClienteId(e.target.value)}
              className="flex-1 rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
              style={{ boxShadow: "var(--shadow-inset)" }}>
              <option value="">Seleccionar cliente</option>
              {clientesList.map((c) => <option key={c.id} value={c.id}>{c.nombre}{c.telefono ? ` (${c.telefono})` : ""}</option>)}
            </select>
            <button type="button" onClick={() => setShowNewClient(true)}
              className="rounded-[10px] border border-[var(--color-line)] bg-[var(--color-panel-raised)] px-3 py-2 text-xs font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
            >
              + Nuevo
            </button>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Producto</label>
          <select name="productId" required value={productoId} onChange={(e) => setProductoId(e.target.value)}
            className="w-full rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
            style={{ boxShadow: "var(--shadow-inset)" }}>
            <option value="">Seleccionar producto</option>
            {productos.map((p) => <option key={p.id} value={p.id}>{p.nombre}{p.modelo ? ` ${p.modelo}` : ""} - {formatCOP(p.precioVenta)}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Valor total ($)</label>
          <input name="valorTotal" type="number" min="0" step="1" required
            defaultValue={valorTotal || ""}
            className="w-full rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
            style={{ boxShadow: "var(--shadow-inset)" }} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Abono inicial ($)</label>
          <input name="abonoInicial" type="number" min="0" step="1" defaultValue="0"
            className="w-full rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
            style={{ boxShadow: "var(--shadow-inset)" }} />
        </div>
        {error && <p className="rounded-lg bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]">{error}</p>}
        <button type="submit" disabled={isPending}
          className="mt-2 rounded-[12px] border-none py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          style={{
            background: "linear-gradient(180deg, var(--color-accent-hi), var(--color-accent) 55%, var(--color-accent-deep))",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4), 0 3px 0 var(--color-accent-deep), 0 6px 14px rgba(20,101,117,0.35)",
          }}>
          {isPending ? "Creando\u2026" : "Crear apartado"}
        </button>
      </form>
    </Modal>
  );
}

function AbonoModal({ apartado, onClose, userId }: {
  apartado: Apartado; onClose: () => void; userId: string;
}) {
  const [state, formAction, isPending] = useActionState(async (_prev: unknown, fd: FormData) => {
    fd.set("apartadoId", apartado.id);
    fd.set("userId", userId);
    const result = await registrarAbono(fd);
    if (result && "success" in result && result.success) onClose();
    return result;
  }, undefined);

  const error = state && "error" in state ? state.error : undefined;
  const restante = Number(apartado.saldoPendiente);

  return (
    <Modal open title={`Abono - ${apartado.cliente.nombre}`} onClose={onClose}>
      <form action={formAction} className="flex flex-col gap-3">
        <div className="rounded-[10px] bg-[var(--color-panel-raised)] p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--color-ink-soft)]">Saldo pendiente</span>
            <span className="font-bold text-[var(--color-danger)]">{formatCOP(restante)}</span>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Monto ($)</label>
          <input name="monto" type="number" min="1" step="1" required
            className="w-full rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
            style={{ boxShadow: "var(--shadow-inset)" }} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">M&eacute;todo de pago</label>
          <select name="metodoPago" defaultValue="EFECTIVO"
            className="w-full rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
            style={{ boxShadow: "var(--shadow-inset)" }}>
            {METODOS_PAGO.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        {error && <p className="rounded-lg bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]">{error}</p>}
        <button type="submit" disabled={isPending}
          className="mt-2 rounded-[12px] border-none py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          style={{
            background: "linear-gradient(180deg, var(--color-accent-hi), var(--color-accent) 55%, var(--color-accent-deep))",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4), 0 3px 0 var(--color-accent-deep), 0 6px 14px rgba(20,101,117,0.35)",
          }}>
          {isPending ? "Registrando\u2026" : "Registrar abono"}
        </button>
      </form>
    </Modal>
  );
}

function SeguimientoModal({ apartado, onClose, userId }: {
  apartado: Apartado; onClose: () => void; userId: string;
}) {
  const [state, formAction, isPending] = useActionState(async (_prev: unknown, fd: FormData) => {
    fd.set("apartadoId", apartado.id);
    fd.set("userId", userId);
    const result = await registrarSeguimiento(fd);
    if (result && "success" in result && result.success) onClose();
    return result;
  }, undefined);

  const error = state && "error" in state ? state.error : undefined;

  return (
    <Modal open title={`Seguimiento - ${apartado.cliente.nombre}`} onClose={onClose}>
      <form action={formAction} className="flex flex-col gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Nota</label>
          <textarea name="nota" required rows={3}
            className="w-full resize-none rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
            style={{ boxShadow: "var(--shadow-inset)" }} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Pr&oacute;xima acci&oacute;n (opcional)</label>
          <input name="proximaAccion"
            className="w-full rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
            style={{ boxShadow: "var(--shadow-inset)" }} />
        </div>
        {error && <p className="rounded-lg bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]">{error}</p>}
        <button type="submit" disabled={isPending}
          className="mt-2 rounded-[12px] border-none py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          style={{
            background: "linear-gradient(180deg, var(--color-accent-hi), var(--color-accent) 55%, var(--color-accent-deep))",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4), 0 3px 0 var(--color-accent-deep), 0 6px 14px rgba(20,101,117,0.35)",
          }}>
          {isPending ? "Guardando\u2026" : "Guardar seguimiento"}
        </button>
      </form>
    </Modal>
  );
}
