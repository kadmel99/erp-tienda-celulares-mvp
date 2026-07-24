"use client";

import { useActionState, useState } from "react";
import Modal from "@/components/modal";
import { abrirCaja, cerrarCaja, registrarMovimiento } from "./actions";

type Movement = {
  id: string;
  tipo: string;
  monto: { toString: () => string };
  concepto: string | null;
  referenceId: string | null;
  createdAt: Date;
};

type Session = {
  id: string;
  saldoInicial: { toString: () => string };
  saldoFinalEsperado: { toString: () => string } | null;
  saldoFinalContado: { toString: () => string } | null;
  diferencia: { toString: () => string } | null;
  abiertaEn: Date;
  cerradaEn: Date | null;
  movimientos: Movement[];
};

type Props = {
  openSession: Session | null;
  closedSessions: Session[];
  sucursalId: string;
  userId: string;
  userName: string;
};

const TIPOS_MOVIMIENTO = [
  { value: "INGRESO_CAJA_MENOR", label: "Ingreso caja menor" },
  { value: "EGRESO_CAJA_MENOR", label: "Egreso caja menor" },
  { value: "OTRO", label: "Otro" },
] as const;

const tipoStyles: Record<string, string> = {
  INGRESO_VENTA: "bg-[var(--color-success-soft)] text-[var(--color-success)]",
  INGRESO_ABONO: "bg-[var(--color-accent-soft)] text-[var(--color-accent-deep)]",
  INGRESO_CAJA_MENOR: "bg-[var(--color-success-soft)] text-[var(--color-success)]",
  EGRESO_CAJA_MENOR: "bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
  OTRO: "bg-[var(--color-panel-raised)] text-[var(--color-ink-soft)]",
};

export function CajaClient({ openSession, closedSessions, sucursalId, userId, userName }: Props) {
  const [showAbrir, setShowAbrir] = useState(false);
  const [showCerrar, setShowCerrar] = useState(false);
  const [showMovimiento, setShowMovimiento] = useState(false);

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-[var(--color-ink)]">Caja</h1>
        <div className="flex gap-2">
          {!openSession ? (
            <button onClick={() => setShowAbrir(true)}
              className="rounded-[12px] border-none px-4 py-2 text-sm font-semibold text-white"
              style={{
                background: "linear-gradient(180deg, var(--color-accent-hi), var(--color-accent) 55%, var(--color-accent-deep))",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4), 0 3px 0 var(--color-accent-deep), 0 6px 14px rgba(20,101,117,0.35)",
              }}>
              Abrir caja
            </button>
          ) : (
            <>
              <button onClick={() => setShowMovimiento(true)}
                className="rounded-[12px] border border-[var(--color-line)] bg-[var(--color-panel-raised)] px-4 py-2 text-sm font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
                + Movimiento
              </button>
              <button onClick={() => setShowCerrar(true)}
                className="rounded-[12px] border-none px-4 py-2 text-sm font-semibold text-white"
                style={{
                  background: "linear-gradient(180deg, var(--color-danger), #8C3F2E)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3), 0 3px 0 #6B2F22, 0 6px 14px rgba(133,67,52,0.35)",
                }}>
                Cerrar caja
              </button>
            </>
          )}
        </div>
      </div>

      {openSession && <SessionCard session={openSession} userName={userName} />}
      {!openSession && (
        <div className="mb-6 rounded-[14px] border border-[var(--color-line)] bg-[var(--color-panel)] p-8 text-center"
          style={{ boxShadow: "var(--shadow-panel)" }}>
          <p className="text-[var(--color-ink-soft)]">No hay una sesi&oacute;n de caja abierta</p>
        </div>
      )}

      {closedSessions.length > 0 && (
        <>
          <h2 className="mb-4 mt-8 text-sm font-semibold text-[var(--color-ink-soft)]">
            SESIONES ANTERIORES
          </h2>
          <div className="space-y-3">
            {closedSessions.map((s) => (
              <div key={s.id}
                className="rounded-[14px] border border-[var(--color-line)] bg-[var(--color-panel)] p-4"
                style={{ boxShadow: "var(--shadow-panel)" }}>
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <div>
                    <span className="font-medium text-[var(--color-ink)]">{userName}</span>
                    <span className="mx-2 text-[var(--color-ink-faint)]">&middot;</span>
                    <span className="text-[var(--color-ink-soft)]">
                      {new Date(s.abiertaEn).toLocaleDateString("es-CO")}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[var(--color-ink-soft)]">
                    <span>Esperado: <strong className="text-[var(--color-ink)]">${Number(s.saldoFinalEsperado).toLocaleString("es-CO")}</strong></span>
                    <span>Contado: <strong className="text-[var(--color-ink)]">${Number(s.saldoFinalContado).toLocaleString("es-CO")}</strong></span>
                    {Number(s.diferencia) !== 0 && (
                      <span className={Number(s.diferencia) > 0 ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"}>
                        Diferencia: ${Number(s.diferencia).toLocaleString("es-CO")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {showAbrir && (
        <AbrirCajaModal onClose={() => setShowAbrir(false)} sucursalId={sucursalId} userId={userId} />
      )}
      {showCerrar && openSession && (
        <CerrarCajaModal session={openSession} onClose={() => setShowCerrar(false)} />
      )}
      {showMovimiento && openSession && (
        <MovimientoModal sessionId={openSession.id} onClose={() => setShowMovimiento(false)} />
      )}
    </>
  );
}

function SessionCard({ session, userName }: { session: Session; userName: string }) {
  const totalIngresos = session.movimientos
    .filter((m) => m.tipo.startsWith("INGRESO"))
    .reduce((s, m) => s + Number(m.monto), 0);
  const totalEgresos = session.movimientos
    .filter((m) => m.tipo === "EGRESO_CAJA_MENOR" || m.tipo === "OTRO")
    .reduce((s, m) => s + Number(m.monto), 0);
  const saldoEsperado = Number(session.saldoInicial) + totalIngresos - totalEgresos;

  return (
    <div className="mb-6 rounded-[14px] border border-[var(--color-line)] bg-[var(--color-panel)]"
      style={{ boxShadow: "var(--shadow-panel)" }}>
      <div className="grid grid-cols-2 gap-4 border-b border-[var(--color-line)] p-4 sm:grid-cols-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Abierta por</p>
          <p className="text-sm font-medium text-[var(--color-ink)]">{userName}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Apertura</p>
          <p className="text-sm text-[var(--color-ink)]">
            {new Date(session.abiertaEn).toLocaleString("es-CO")}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Saldo inicial</p>
          <p className="text-sm font-semibold text-[var(--color-ink)]" style={{ fontVariantNumeric: "tabular-nums" }}>
            ${Number(session.saldoInicial).toLocaleString("es-CO")}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Saldo actual</p>
          <p className="text-sm font-bold text-[var(--color-ink)]" style={{ fontVariantNumeric: "tabular-nums" }}>
            ${saldoEsperado.toLocaleString("es-CO")}
          </p>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
            Movimientos ({session.movimientos.length})
          </h3>
          <div className="flex gap-4 text-xs text-[var(--color-ink-soft)]">
            <span>Ingresos: <strong className="text-[var(--color-success)]">${totalIngresos.toLocaleString("es-CO")}</strong></span>
            <span>Egresos: <strong className="text-[var(--color-danger)]">${totalEgresos.toLocaleString("es-CO")}</strong></span>
          </div>
        </div>
        <div className="overflow-hidden rounded-[10px] border border-[var(--color-line)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--color-panel-raised)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Monto</th>
                <th className="px-3 py-2">Concepto</th>
                <th className="px-3 py-2">Hora</th>
              </tr>
            </thead>
            <tbody>
              {session.movimientos.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-[var(--color-ink-faint)]">
                    Sin movimientos
                  </td>
                </tr>
              )}
              {session.movimientos.map((m) => (
                <tr key={m.id} className="border-t border-[var(--color-line)]">
                  <td className="px-3 py-2">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${tipoStyles[m.tipo] ?? ""}`}>
                      {m.tipo.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-semibold text-[var(--color-ink)]" style={{ fontVariantNumeric: "tabular-nums" }}>
                    ${Number(m.monto).toLocaleString("es-CO")}
                  </td>
                  <td className="px-3 py-2 text-[var(--color-ink-soft)]">{m.concepto ?? "\u2014"}</td>
                  <td className="px-3 py-2 text-xs text-[var(--color-ink-faint)]">
                    {new Date(m.createdAt).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AbrirCajaModal({ onClose, sucursalId, userId }: {
  onClose: () => void;
  sucursalId: string;
  userId: string;
}) {
  const [state, formAction, isPending] = useActionState(async (_prev: unknown, fd: FormData) => {
    fd.set("sucursalId", sucursalId);
    fd.set("userId", userId);
    const result = await abrirCaja(fd);
    if (result && "success" in result && result.success) onClose();
    return result;
  }, undefined);

  const error = state && "error" in state ? state.error : undefined;

  return (
    <Modal open title="Abrir caja" onClose={onClose}>
      <form action={formAction} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
            Saldo inicial ($)
          </label>
          <input name="saldoInicial" type="number" min="0" step="0.01" defaultValue="0"
            className="w-full rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
            style={{ boxShadow: "var(--shadow-inset)" }} />
        </div>
        {error && <p className="rounded-lg bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]">{error}</p>}
        <button type="submit" disabled={isPending}
          className="rounded-[12px] border-none py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          style={{
            background: "linear-gradient(180deg, var(--color-accent-hi), var(--color-accent) 55%, var(--color-accent-deep))",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4), 0 3px 0 var(--color-accent-deep), 0 6px 14px rgba(20,101,117,0.35)",
          }}>
          {isPending ? "Abriendo\u2026" : "Abrir caja"}
        </button>
      </form>
    </Modal>
  );
}

function CerrarCajaModal({ session, onClose }: {
  session: Session;
  onClose: () => void;
}) {
  const action = cerrarCaja.bind(null, session.id);
  const [state, formAction, isPending] = useActionState(async (_prev: unknown, fd: FormData) => {
    const result = await action(fd);
    if (result && "success" in result && result.success) onClose();
    return result;
  }, undefined);

  const error = state && "error" in state ? state.error : undefined;

  const totalIngresos = session.movimientos
    .filter((m) => m.tipo.startsWith("INGRESO"))
    .reduce((s, m) => s + Number(m.monto), 0);
  const totalEgresos = session.movimientos
    .filter((m) => m.tipo === "EGRESO_CAJA_MENOR" || m.tipo === "OTRO")
    .reduce((s, m) => s + Number(m.monto), 0);
  const saldoEsperado = Number(session.saldoInicial) + totalIngresos - totalEgresos;

  return (
    <Modal open title="Cerrar caja" onClose={onClose}>
      <form action={formAction} className="flex flex-col gap-4">
        <div className="rounded-[10px] bg-[var(--color-panel-raised)] p-3 text-sm">
          <div className="mb-1 flex justify-between">
            <span className="text-[var(--color-ink-soft)]">Saldo inicial</span>
            <span className="font-medium text-[var(--color-ink)]">${Number(session.saldoInicial).toLocaleString("es-CO")}</span>
          </div>
          <div className="mb-1 flex justify-between">
            <span className="text-[var(--color-ink-soft)]">Ingresos</span>
            <span className="font-medium text-[var(--color-success)]">+${totalIngresos.toLocaleString("es-CO")}</span>
          </div>
          <div className="mb-1 flex justify-between">
            <span className="text-[var(--color-ink-soft)]">Egresos</span>
            <span className="font-medium text-[var(--color-danger)]">-${totalEgresos.toLocaleString("es-CO")}</span>
          </div>
          <div className="flex justify-between border-t border-[var(--color-line)] pt-1 font-bold text-[var(--color-ink)]">
            <span>Saldo esperado</span>
            <span>${saldoEsperado.toLocaleString("es-CO")}</span>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
            Conteo f&iacute;sico ($)
          </label>
          <input name="saldoFinalContado" type="number" min="0" step="0.01" required
            className="w-full rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
            style={{ boxShadow: "var(--shadow-inset)" }} />
        </div>
        {error && <p className="rounded-lg bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]">{error}</p>}
        <button type="submit" disabled={isPending}
          className="rounded-[12px] border-none py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          style={{
            background: "linear-gradient(180deg, var(--color-danger), #8C3F2E)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3), 0 3px 0 #6B2F22, 0 6px 14px rgba(133,67,52,0.35)",
          }}>
          {isPending ? "Cerrando\u2026" : "Cerrar caja"}
        </button>
      </form>
    </Modal>
  );
}

function MovimientoModal({ sessionId, onClose }: {
  sessionId: string;
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState(async (_prev: unknown, fd: FormData) => {
    fd.set("sessionId", sessionId);
    const result = await registrarMovimiento(fd);
    if (result && "success" in result && result.success) onClose();
    return result;
  }, undefined);

  const error = state && "error" in state ? state.error : undefined;

  return (
    <Modal open title="Registrar movimiento" onClose={onClose}>
      <form action={formAction} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Tipo</label>
          <select name="tipo" required
            className="w-full rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
            style={{ boxShadow: "var(--shadow-inset)" }}>
            {TIPOS_MOVIMIENTO.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Monto ($)</label>
          <input name="monto" type="number" min="0" step="0.01" required
            className="w-full rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
            style={{ boxShadow: "var(--shadow-inset)" }} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Concepto</label>
          <textarea name="concepto" rows={2}
            className="w-full resize-none rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
            style={{ boxShadow: "var(--shadow-inset)" }} />
        </div>
        {error && <p className="rounded-lg bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]">{error}</p>}
        <button type="submit" disabled={isPending}
          className="rounded-[12px] border-none py-2.5 text-sm font-semibold text-white disabled:opacity-50"
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
