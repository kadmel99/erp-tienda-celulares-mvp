"use client";

import { useActionState, useMemo, useState } from "react";
import Modal from "@/components/modal";
import { crearHallazgo, resolverHallazgo, generarReportePDF } from "./actions";
import { openPdfDataUrl } from "@/lib/open-pdf";

const TIPOS = ["INVENTARIO", "CAJA", "VENTAS", "OTRO"] as const;
const SEVERIDADES = ["BAJA", "MEDIA", "ALTA"] as const;

const TIPO_LABEL: Record<string, string> = {
  INVENTARIO: "Inventario",
  CAJA: "Caja",
  VENTAS: "Ventas",
  OTRO: "Otro",
};

const SEVERIDAD_STYLES: Record<string, string> = {
  BAJA: "bg-[var(--color-panel-raised)] text-[var(--color-ink-soft)]",
  MEDIA: "bg-[var(--color-accent-soft)] text-[var(--color-accent-deep)]",
  ALTA: "bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
};

type Hallazgo = {
  id: string;
  sucursalId: string;
  tipo: string;
  severidad: string;
  titulo: string;
  descripcion: string;
  status: string;
  autorNombre: string;
  createdAt: Date;
  sucursal: { nombre: string };
};

type Sucursal = { id: string; nombre: string };

type Props = {
  hallazgos: Hallazgo[];
  sucursales: Sucursal[];
  isAdmin: boolean;
};

export function AuditoriaClient({ hallazgos, sucursales, isAdmin }: Props) {
  const [filtroSucursal, setFiltroSucursal] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [showNuevo, setShowNuevo] = useState(false);
  const [descargando, setDescargando] = useState(false);
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);

  const filtrados = useMemo(() => {
    return hallazgos.filter((h) => {
      if (filtroSucursal && h.sucursalId !== filtroSucursal) return false;
      if (filtroTipo && h.tipo !== filtroTipo) return false;
      if (filtroStatus && h.status !== filtroStatus) return false;
      return true;
    });
  }, [hallazgos, filtroSucursal, filtroTipo, filtroStatus]);

  async function handleDescargar() {
    setDescargando(true);
    setMsg(null);
    const result = await generarReportePDF(filtrados.map((h) => h.id));
    if (typeof result === "string") {
      openPdfDataUrl(result, "reporte-auditoria.pdf");
    } else {
      setMsg({ text: result.error, error: true });
    }
    setDescargando(false);
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-[var(--color-ink)]">Auditor&iacute;a</h1>
          <p className="text-sm text-[var(--color-ink-soft)]">{hallazgos.length} hallazgos registrados</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleDescargar} disabled={descargando || filtrados.length === 0}
            className="rounded-[12px] border border-[var(--color-line)] bg-[var(--color-panel-raised)] px-4 py-2 text-sm font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] disabled:opacity-50">
            {descargando ? "Generando…" : "Descargar reporte PDF"}
          </button>
          <button onClick={() => setShowNuevo(true)}
            className="rounded-[12px] border-none px-4 py-2 text-sm font-semibold text-white"
            style={{
              background: "linear-gradient(180deg, var(--color-accent-hi), var(--color-accent) 55%, var(--color-accent-deep))",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4), 0 3px 0 var(--color-accent-deep), 0 6px 14px rgba(20,101,117,0.35)",
            }}>
            Nuevo hallazgo
          </button>
        </div>
      </div>

      {msg && (
        <div className={`mb-4 rounded-lg px-4 py-2 text-sm ${msg.error ? "bg-[var(--color-danger-soft)] text-[var(--color-danger)]" : "bg-[var(--color-success-soft)] text-[var(--color-success)]"}`}>
          {msg.text}
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-3">
        {sucursales.length > 1 && (
          <select value={filtroSucursal} onChange={(e) => setFiltroSucursal(e.target.value)}
            className="rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
            style={{ boxShadow: "var(--shadow-inset)" }}>
            <option value="">Todas las sucursales</option>
            {sucursales.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
        )}
        <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}
          className="rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
          style={{ boxShadow: "var(--shadow-inset)" }}>
          <option value="">Todos los tipos</option>
          {TIPOS.map((t) => <option key={t} value={t}>{TIPO_LABEL[t]}</option>)}
        </select>
        <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}
          className="rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
          style={{ boxShadow: "var(--shadow-inset)" }}>
          <option value="">Todos los estados</option>
          <option value="ABIERTO">Abierto</option>
          <option value="RESUELTO">Resuelto</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-[14px] border border-[var(--color-line)] bg-[var(--color-panel)]"
        style={{ boxShadow: "var(--shadow-panel)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-line)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
              <th className="px-4 py-3">Sucursal</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Severidad</th>
              <th className="px-4 py-3">T&iacute;tulo</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Autor</th>
              <th className="px-4 py-3">Fecha</th>
              {isAdmin && <th className="px-4 py-3">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 8 : 7} className="px-4 py-8 text-center text-[var(--color-ink-faint)]">
                  No hay hallazgos registrados
                </td>
              </tr>
            )}
            {filtrados.map((h) => (
              <HallazgoRow key={h.id} hallazgo={h} isAdmin={isAdmin} />
            ))}
          </tbody>
        </table>
      </div>

      {showNuevo && (
        <NuevoHallazgoModal sucursales={sucursales} onClose={() => setShowNuevo(false)} />
      )}
    </>
  );
}

function HallazgoRow({ hallazgo, isAdmin }: { hallazgo: Hallazgo; isAdmin: boolean }) {
  const [expandido, setExpandido] = useState(false);
  const [resolviendo, setResolviendo] = useState(false);
  const [status, setStatus] = useState(hallazgo.status);

  async function handleResolver() {
    setResolviendo(true);
    const result = await resolverHallazgo(hallazgo.id);
    if (result && "success" in result && result.success) setStatus("RESUELTO");
    setResolviendo(false);
  }

  return (
    <>
      <tr className="cursor-pointer border-b border-[var(--color-line)] last:border-0 hover:bg-[var(--color-panel-raised)]"
        onClick={() => setExpandido((v) => !v)}>
        <td className="px-4 py-3 text-[var(--color-ink-soft)]">{hallazgo.sucursal.nombre}</td>
        <td className="px-4 py-3">
          <span className="rounded-full bg-[var(--color-panel-raised)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-ink-soft)]">
            {TIPO_LABEL[hallazgo.tipo] ?? hallazgo.tipo}
          </span>
        </td>
        <td className="px-4 py-3">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${SEVERIDAD_STYLES[hallazgo.severidad] ?? ""}`}>
            {hallazgo.severidad}
          </span>
        </td>
        <td className="px-4 py-3 font-medium text-[var(--color-ink)]">{hallazgo.titulo}</td>
        <td className="px-4 py-3">
          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
            status === "ABIERTO"
              ? "bg-[var(--color-danger-soft)] text-[var(--color-danger)]"
              : "bg-[var(--color-success-soft)] text-[var(--color-success)]"
          }`}>
            {status === "ABIERTO" ? "Abierto" : "Resuelto"}
          </span>
        </td>
        <td className="px-4 py-3 text-xs text-[var(--color-ink-soft)]">{hallazgo.autorNombre}</td>
        <td className="px-4 py-3 text-xs text-[var(--color-ink-faint)]">
          {new Date(hallazgo.createdAt).toLocaleDateString("es-CO")}
        </td>
        {isAdmin && (
          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
            {status === "ABIERTO" && (
              <button onClick={handleResolver} disabled={resolviendo}
                className="rounded-[8px] border border-[var(--color-line)] bg-[var(--color-panel-raised)] px-3 py-1 text-xs font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] disabled:opacity-50">
                {resolviendo ? "…" : "Marcar resuelto"}
              </button>
            )}
          </td>
        )}
      </tr>
      {expandido && (
        <tr className="border-b border-[var(--color-line)] bg-[var(--color-panel-raised)]">
          <td colSpan={isAdmin ? 8 : 7} className="px-4 py-3 text-sm text-[var(--color-ink-soft)]">
            {hallazgo.descripcion}
          </td>
        </tr>
      )}
    </>
  );
}

function NuevoHallazgoModal({ sucursales, onClose }: {
  sucursales: Sucursal[];
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState(async (_prev: unknown, fd: FormData) => {
    const result = await crearHallazgo(fd);
    if (result && "success" in result && result.success) onClose();
    return result;
  }, undefined);

  const error = state && "error" in state ? state.error : undefined;

  return (
    <Modal open title="Nuevo hallazgo" onClose={onClose}>
      <form action={formAction} className="flex flex-col gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Sucursal</label>
          <select name="sucursalId" required
            className="w-full rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
            style={{ boxShadow: "var(--shadow-inset)" }}>
            <option value="">Seleccionar sucursal</option>
            {sucursales.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Tipo</label>
            <select name="tipo" required defaultValue="OTRO"
              className="w-full rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
              style={{ boxShadow: "var(--shadow-inset)" }}>
              {TIPOS.map((t) => <option key={t} value={t}>{TIPO_LABEL[t]}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Severidad</label>
            <select name="severidad" required defaultValue="MEDIA"
              className="w-full rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
              style={{ boxShadow: "var(--shadow-inset)" }}>
              {SEVERIDADES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">T&iacute;tulo</label>
          <input name="titulo" required maxLength={120}
            className="w-full rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
            style={{ boxShadow: "var(--shadow-inset)" }} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Descripci&oacute;n</label>
          <textarea name="descripcion" required rows={4}
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
          {isPending ? "Guardando…" : "Registrar hallazgo"}
        </button>
      </form>
    </Modal>
  );
}
