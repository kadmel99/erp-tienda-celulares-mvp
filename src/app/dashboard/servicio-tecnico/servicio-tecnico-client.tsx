"use client";

import { useActionState, useMemo, useState } from "react";
import Modal from "@/components/modal";
import { NewClientModal } from "@/components/new-client-modal";
import { formatCOP } from "@/lib/money";
import { openPdfDataUrl } from "@/lib/open-pdf";
import {
  crearServicio,
  cambiarEstado,
  guardarDiagnostico,
  agregarRepuesto,
  eliminarRepuesto,
  agregarSeguimiento,
  getOrdenPDFUrl,
} from "./actions";

type Cliente = { id: string; nombre: string; telefono: string | null; correo: string | null; ciudad: string | null; cedula: string | null; direccion: string | null };
type Producto = { id: string; nombre: string; modelo: string | null; sku: string; costo: { toString: () => string }; sucursalId: string };
type Tecnico = { id: string; nombre: string };
type Repuesto = { id: string; nombre: string; cantidad: number; costoUnitario: { toString: () => string }; productId: string | null };
type Seguimiento = { id: string; nota: string; createdAt: Date };

type Orden = {
  id: string;
  numero: number;
  sucursalId: string;
  status: string;
  marca: string;
  modelo: string;
  color: string | null;
  imei: string | null;
  claveDesbloqueo: string | null;
  falla: string;
  condicionFisica: string | null;
  accesorios: string | null;
  diagnostico: string | null;
  costoEstimado: { toString: () => string } | null;
  fechaPromesa: Date | null;
  costoFinal: { toString: () => string } | null;
  garantiaDias: number | null;
  entregadoEn: Date | null;
  createdAt: Date;
  cliente: { id: string; nombre: string; telefono: string | null };
  sucursal: { nombre: string };
  repuestos: Repuesto[];
  seguimientos: Seguimiento[];
};

const STATUS_FLOW = [
  { value: "RECIBIDO", label: "Recibido" },
  { value: "DIAGNOSTICO", label: "En diagnóstico" },
  { value: "COTIZADO", label: "Cotizado" },
  { value: "APROBADO", label: "Aprobado" },
  { value: "EN_REPARACION", label: "En reparación" },
  { value: "ESPERANDO_REPUESTO", label: "Esperando repuesto" },
  { value: "LISTO", label: "Listo para entrega" },
  { value: "ENTREGADO", label: "Entregado" },
  { value: "NO_APROBADO", label: "No aprobado por el cliente" },
  { value: "NO_REPARABLE", label: "No reparable" },
  { value: "CANCELADO", label: "Cancelado" },
] as const;

const STATUS_STYLE: Record<string, string> = {
  RECIBIDO: "bg-[var(--color-accent-soft)] text-[var(--color-accent-deep)]",
  DIAGNOSTICO: "bg-[var(--color-accent-soft)] text-[var(--color-accent-deep)]",
  COTIZADO: "bg-[var(--color-accent-soft)] text-[var(--color-accent-deep)]",
  APROBADO: "bg-[var(--color-accent-soft)] text-[var(--color-accent-deep)]",
  EN_REPARACION: "bg-[var(--color-accent-soft)] text-[var(--color-accent-deep)]",
  ESPERANDO_REPUESTO: "bg-[var(--color-accent-soft)] text-[var(--color-accent-deep)]",
  LISTO: "bg-[var(--color-success-soft)] text-[var(--color-success)]",
  ENTREGADO: "bg-[var(--color-success-soft)] text-[var(--color-success)]",
  NO_APROBADO: "bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
  NO_REPARABLE: "bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
  CANCELADO: "bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
};

const STATUS_LABEL: Record<string, string> = {};
STATUS_FLOW.forEach((s) => { STATUS_LABEL[s.value] = s.label; });

const inputClass = "w-full rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none";
const inputStyle = { boxShadow: "var(--shadow-inset)" };

type Props = {
  ordenes: Orden[];
  clientes: Cliente[];
  productos: Producto[];
  tecnicos: Tecnico[];
  sucursalId: string;
  userId: string;
  isAdmin: boolean;
};

export function ServicioTecnicoClient({ ordenes, clientes, productos, tecnicos, sucursalId, userId, isAdmin }: Props) {
  const [clientesList, setClientesList] = useState(clientes);
  const [creando, setCreando] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");

  const filtradas = useMemo(() => {
    const q = busqueda.toLowerCase();
    return ordenes.filter((o) => {
      if (filtroStatus && o.status !== filtroStatus) return false;
      if (!q) return true;
      return (
        o.cliente.nombre.toLowerCase().includes(q) ||
        o.marca.toLowerCase().includes(q) ||
        o.modelo.toLowerCase().includes(q) ||
        o.imei?.toLowerCase().includes(q) ||
        String(o.numero).includes(q)
      );
    });
  }, [ordenes, busqueda, filtroStatus]);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-[var(--color-ink)]">Servicio técnico</h1>
          <p className="text-sm text-[var(--color-ink-soft)]">{ordenes.length} órdenes</p>
        </div>
        <button onClick={() => setCreando(true)}
          className="rounded-[12px] border-none px-4 py-2 text-sm font-semibold text-white"
          style={{
            background: "linear-gradient(180deg, var(--color-accent-hi), var(--color-accent) 55%, var(--color-accent-deep))",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4), 0 3px 0 var(--color-accent-deep), 0 6px 14px rgba(20,101,117,0.35)",
          }}>
          Nueva orden
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          placeholder="Buscar por cliente, equipo, IMEI o número..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full max-w-sm rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3.5 py-2 text-sm text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-faint)]"
          style={{ boxShadow: "var(--shadow-inset)" }}
        />
        <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}
          className={inputClass} style={{ ...inputStyle, width: "auto" }}>
          <option value="">Todos los estados</option>
          {STATUS_FLOW.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      <div className="space-y-3">
        {filtradas.length === 0 && (
          <div className="rounded-[14px] border border-[var(--color-line)] bg-[var(--color-panel)] p-8 text-center"
            style={{ boxShadow: "var(--shadow-panel)" }}>
            <p className="text-[var(--color-ink-soft)]">No hay órdenes de servicio</p>
          </div>
        )}
        {filtradas.map((o) => (
          <OrdenCard
            key={o.id}
            orden={o}
            expanded={expanded === o.id}
            onToggle={() => setExpanded(expanded === o.id ? null : o.id)}
            productos={productos.filter((p) => p.sucursalId === o.sucursalId)}
            userId={userId}
            isAdmin={isAdmin}
          />
        ))}
      </div>

      {creando && (
        <NuevaOrdenModal
          onClose={() => setCreando(false)}
          clientes={clientesList}
          tecnicos={tecnicos}
          sucursalId={sucursalId}
          userId={userId}
          onClienteCreado={(c) => setClientesList((prev) => [...prev, c].sort((a, b) => a.nombre.localeCompare(b.nombre)))}
        />
      )}
    </>
  );
}

function OrdenCard({ orden, expanded, onToggle, productos, userId, isAdmin }: {
  orden: Orden;
  expanded: boolean;
  onToggle: () => void;
  productos: Producto[];
  userId: string;
  isAdmin: boolean;
}) {
  const [verLoading, setVerLoading] = useState(false);

  async function handleVerPDF() {
    setVerLoading(true);
    const result = await getOrdenPDFUrl(orden.id);
    if (typeof result === "string") openPdfDataUrl(result, `orden-servicio-${orden.numero}.pdf`);
    setVerLoading(false);
  }

  return (
    <div className="rounded-[14px] border border-[var(--color-line)] bg-[var(--color-panel)] p-4"
      style={{ boxShadow: "var(--shadow-panel)" }}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-sm font-semibold text-[var(--color-ink)]">#{orden.numero} — {orden.marca} {orden.modelo}</span>
            {isAdmin && <span className="text-xs text-[var(--color-ink-faint)]">{orden.sucursal.nombre}</span>}
          </div>
          <p className="text-xs text-[var(--color-ink-soft)]">{orden.cliente.nombre}{orden.cliente.telefono ? ` · ${orden.cliente.telefono}` : ""}</p>
          <p className="mt-1 truncate text-sm text-[var(--color-ink)]">{orden.falla}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[orden.status] ?? ""}`}>
            {STATUS_LABEL[orden.status] ?? orden.status}
          </span>
          <button onClick={onToggle}
            className="rounded-[8px] border border-[var(--color-line)] bg-[var(--color-panel-raised)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
            {expanded ? "Cerrar" : "Detalle"}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 flex flex-col gap-5 border-t border-[var(--color-line)] pt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Equipo</p>
              <p className="text-sm text-[var(--color-ink)]">{orden.marca} {orden.modelo}{orden.color ? ` — ${orden.color}` : ""}</p>
              {orden.imei && <p className="text-xs text-[var(--color-ink-faint)]">IMEI: {orden.imei}</p>}
              {orden.claveDesbloqueo && <p className="text-xs text-[var(--color-ink-faint)]">Clave: {orden.claveDesbloqueo}</p>}
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Al recibir</p>
              {orden.condicionFisica && <p className="text-sm text-[var(--color-ink)]">Condición: {orden.condicionFisica}</p>}
              {orden.accesorios && <p className="text-sm text-[var(--color-ink)]">Accesorios: {orden.accesorios}</p>}
              {!orden.condicionFisica && !orden.accesorios && <p className="text-sm text-[var(--color-ink-faint)]">Sin notas</p>}
            </div>
          </div>

          <EstadoSection ordenId={orden.id} status={orden.status} />
          <DiagnosticoSection orden={orden} />
          <RepuestosSection ordenId={orden.id} repuestos={orden.repuestos} productos={productos} userId={userId} />
          <SeguimientosSection ordenId={orden.id} seguimientos={orden.seguimientos} userId={userId} />

          <div className="flex items-center justify-between border-t border-[var(--color-line)] pt-3">
            <p className="text-xs text-[var(--color-ink-faint)]">
              Creado: {new Date(orden.createdAt).toLocaleDateString("es-CO")}
              {orden.entregadoEn && ` · Entregado: ${new Date(orden.entregadoEn).toLocaleDateString("es-CO")}`}
            </p>
            <button onClick={handleVerPDF} disabled={verLoading}
              className="rounded-[8px] border border-[var(--color-line)] bg-[var(--color-panel-raised)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] disabled:opacity-50">
              {verLoading ? "Generando…" : "Ver comprobante PDF"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function EstadoSection({ ordenId, status }: { ordenId: string; status: string }) {
  const [value, setValue] = useState(status);
  const [saving, setSaving] = useState(false);

  async function handleActualizar() {
    setSaving(true);
    await cambiarEstado(ordenId, value);
    setSaving(false);
  }

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Estado</p>
      <div className="flex flex-wrap items-center gap-2">
        <select value={value} onChange={(e) => setValue(e.target.value)} className={inputClass} style={{ ...inputStyle, width: "auto" }}>
          {STATUS_FLOW.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <button onClick={handleActualizar} disabled={saving || value === status}
          className="rounded-[8px] border-none px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
          style={{ background: "var(--color-accent)" }}>
          {saving ? "Guardando…" : "Actualizar estado"}
        </button>
        {value === "ENTREGADO" && (
          <span className="text-xs text-[var(--color-ink-faint)]">
            Si hay caja abierta y costo final definido, registra el ingreso automáticamente.
          </span>
        )}
      </div>
    </div>
  );
}

function DiagnosticoSection({ orden }: { orden: Orden }) {
  const [state, formAction, isPending] = useActionState(async (_prev: unknown, fd: FormData) => {
    return guardarDiagnostico(orden.id, fd);
  }, undefined);

  const error = state && "error" in state ? state.error : undefined;

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Diagnóstico y cotización</p>
      <form action={formAction} className="flex flex-col gap-3">
        <textarea name="diagnostico" defaultValue={orden.diagnostico ?? ""} rows={2}
          placeholder="Diagnóstico del técnico"
          className={`${inputClass} resize-none`} style={inputStyle} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-[var(--color-ink-faint)]">Costo estimado</label>
            <input name="costoEstimado" type="number" min="0" step="1000" defaultValue={orden.costoEstimado ? Number(orden.costoEstimado) : ""}
              className={inputClass} style={inputStyle} />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-[var(--color-ink-faint)]">Costo final</label>
            <input name="costoFinal" type="number" min="0" step="1000" defaultValue={orden.costoFinal ? Number(orden.costoFinal) : ""}
              className={inputClass} style={inputStyle} />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-[var(--color-ink-faint)]">Fecha promesa</label>
            <input name="fechaPromesa" type="date" defaultValue={orden.fechaPromesa ? new Date(orden.fechaPromesa).toISOString().slice(0, 10) : ""}
              className={inputClass} style={inputStyle} />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-[var(--color-ink-faint)]">Garantía (días)</label>
            <input name="garantiaDias" type="number" min="0" defaultValue={orden.garantiaDias ?? ""}
              className={inputClass} style={inputStyle} />
          </div>
        </div>
        {error && <p className="rounded-lg bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]">{error}</p>}
        <button type="submit" disabled={isPending}
          className="self-start rounded-[8px] border-none px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
          style={{ background: "var(--color-accent)" }}>
          {isPending ? "Guardando…" : "Guardar diagnóstico"}
        </button>
      </form>
    </div>
  );
}

function RepuestosSection({ ordenId, repuestos, productos, userId }: {
  ordenId: string; repuestos: Repuesto[]; productos: Producto[]; userId: string;
}) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Repuestos</p>
        <button onClick={() => setShowForm((v) => !v)}
          className="text-xs font-semibold text-[var(--color-accent-deep)] hover:underline">
          {showForm ? "Cancelar" : "+ Agregar repuesto"}
        </button>
      </div>

      {repuestos.length > 0 && (
        <div className="mb-2 overflow-hidden rounded-[10px] border border-[var(--color-line)]">
          <table className="w-full text-xs">
            <tbody>
              {repuestos.map((r) => (
                <tr key={r.id} className="border-b border-[var(--color-line)] last:border-0">
                  <td className="px-3 py-2 text-[var(--color-ink)]">{r.nombre}</td>
                  <td className="px-3 py-2 text-[var(--color-ink-soft)]" style={{ fontVariantNumeric: "tabular-nums" }}>×{r.cantidad}</td>
                  <td className="px-3 py-2 text-right text-[var(--color-ink)]" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {formatCOP(Number(r.costoUnitario) * r.cantidad)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={async () => { await eliminarRepuesto(r.id, userId); }}
                      className="text-[var(--color-ink-faint)] hover:text-[var(--color-danger)]">
                      Quitar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {repuestos.length === 0 && !showForm && (
        <p className="text-sm text-[var(--color-ink-faint)]">Sin repuestos registrados</p>
      )}

      {showForm && (
        <AgregarRepuestoForm ordenId={ordenId} productos={productos} userId={userId} onDone={() => setShowForm(false)} />
      )}
    </div>
  );
}

function AgregarRepuestoForm({ ordenId, productos, userId, onDone }: {
  ordenId: string; productos: Producto[]; userId: string; onDone: () => void;
}) {
  const [productId, setProductId] = useState("");
  const [state, formAction, isPending] = useActionState(async (_prev: unknown, fd: FormData) => {
    fd.set("userId", userId);
    if (productId) {
      const p = productos.find((x) => x.id === productId);
      if (p) {
        fd.set("productId", productId);
        if (!fd.get("nombre")) fd.set("nombre", `${p.nombre}${p.modelo ? ` ${p.modelo}` : ""}`);
      }
    }
    const result = await agregarRepuesto(ordenId, fd);
    if (result && "success" in result && result.success) onDone();
    return result;
  }, undefined);

  const error = state && "error" in state ? state.error : undefined;

  return (
    <form action={formAction} className="mt-2 flex flex-col gap-2 rounded-[10px] border border-[var(--color-line)] bg-[var(--color-panel-raised)] p-3">
      <select value={productId} onChange={(e) => setProductId(e.target.value)} className={inputClass} style={inputStyle}>
        <option value="">Repuesto libre (no descuenta inventario)</option>
        {productos.map((p) => <option key={p.id} value={p.id}>{p.nombre}{p.modelo ? ` ${p.modelo}` : ""} ({p.sku})</option>)}
      </select>
      {!productId && (
        <input name="nombre" placeholder="Descripción del repuesto" className={inputClass} style={inputStyle} />
      )}
      <div className="grid grid-cols-2 gap-2">
        <input name="cantidad" type="number" min="1" defaultValue={1} placeholder="Cantidad" className={inputClass} style={inputStyle} />
        <input name="costoUnitario" type="number" min="0" step="1000" placeholder="Costo unitario" required className={inputClass} style={inputStyle} />
      </div>
      {error && <p className="rounded-lg bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]">{error}</p>}
      <button type="submit" disabled={isPending}
        className="self-start rounded-[8px] border-none px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
        style={{ background: "var(--color-accent)" }}>
        {isPending ? "Agregando…" : "Agregar"}
      </button>
    </form>
  );
}

function SeguimientosSection({ ordenId, seguimientos, userId }: {
  ordenId: string; seguimientos: Seguimiento[]; userId: string;
}) {
  const [state, formAction, isPending] = useActionState(async (_prev: unknown, fd: FormData) => {
    fd.set("userId", userId);
    return agregarSeguimiento(ordenId, fd);
  }, undefined);

  const error = state && "error" in state ? state.error : undefined;

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Seguimiento</p>
      {seguimientos.length > 0 && (
        <div className="mb-2 flex flex-col gap-1.5">
          {seguimientos.map((s) => (
            <div key={s.id} className="rounded-[8px] bg-[var(--color-panel-raised)] px-3 py-2 text-xs">
              <p className="text-[var(--color-ink)]">{s.nota}</p>
              <p className="mt-0.5 text-[var(--color-ink-faint)]">{new Date(s.createdAt).toLocaleString("es-CO")}</p>
            </div>
          ))}
        </div>
      )}
      <form action={formAction} className="flex gap-2">
        <input name="nota" placeholder="Agregar nota de seguimiento" className={`${inputClass} flex-1`} style={inputStyle} />
        <button type="submit" disabled={isPending}
          className="shrink-0 rounded-[8px] border-none px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
          style={{ background: "var(--color-accent)" }}>
          {isPending ? "…" : "Agregar"}
        </button>
      </form>
      {error && <p className="mt-1 text-xs text-[var(--color-danger)]">{error}</p>}
    </div>
  );
}

function NuevaOrdenModal({ onClose, clientes, tecnicos, sucursalId, userId, onClienteCreado }: {
  onClose: () => void;
  clientes: Cliente[];
  tecnicos: Tecnico[];
  sucursalId: string;
  userId: string;
  onClienteCreado: (c: Cliente) => void;
}) {
  const [showNewClient, setShowNewClient] = useState(false);
  const [clienteId, setClienteId] = useState("");

  const [state, formAction, isPending] = useActionState(async (_prev: unknown, fd: FormData) => {
    fd.set("sucursalId", sucursalId);
    fd.set("userId", userId);
    fd.set("clienteId", clienteId);
    const result = await crearServicio(fd);
    if (result && "success" in result && result.success) onClose();
    return result;
  }, undefined);

  const error = state && "error" in state ? state.error : undefined;

  if (showNewClient) {
    return (
      <NewClientModal
        onClose={() => setShowNewClient(false)}
        onCreated={(c) => { onClienteCreado(c); setClienteId(c.id); setShowNewClient(false); }}
      />
    );
  }

  return (
    <Modal open title="Nueva orden de servicio" onClose={onClose}>
      <form action={formAction} className="flex flex-col gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Cliente</label>
          <div className="flex gap-2">
            <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} required
              className={`${inputClass} flex-1`} style={inputStyle}>
              <option value="">Seleccionar cliente</option>
              {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}{c.telefono ? ` - ${c.telefono}` : ""}</option>)}
            </select>
            <button type="button" onClick={() => setShowNewClient(true)}
              className="rounded-[10px] border border-[var(--color-line)] bg-[var(--color-panel-raised)] px-3 py-2 text-xs font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
              + Nuevo
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Técnico asignado</label>
          <select name="tecnicoId" required className={inputClass} style={inputStyle}>
            <option value="">Seleccionar técnico</option>
            {tecnicos.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Marca</label>
            <input name="marca" required placeholder="Apple" className={inputClass} style={inputStyle} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Modelo</label>
            <input name="modelo" required placeholder="iPhone 13" className={inputClass} style={inputStyle} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Color</label>
            <input name="color" className={inputClass} style={inputStyle} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">IMEI</label>
            <input name="imei" className={inputClass} style={inputStyle} />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Clave de desbloqueo</label>
          <input name="claveDesbloqueo" placeholder="Opcional" className={inputClass} style={inputStyle} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Falla reportada</label>
          <textarea name="falla" required rows={2} className={`${inputClass} resize-none`} style={inputStyle} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Condición física al recibir</label>
          <textarea name="condicionFisica" rows={2} placeholder="Rayones, pantalla, botones, batería…" className={`${inputClass} resize-none`} style={inputStyle} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Accesorios que deja el cliente</label>
          <input name="accesorios" placeholder="Cargador, funda…" className={inputClass} style={inputStyle} />
        </div>

        {error && <p className="rounded-lg bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]">{error}</p>}
        <button type="submit" disabled={isPending}
          className="mt-2 rounded-[12px] border-none py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          style={{
            background: "linear-gradient(180deg, var(--color-accent-hi), var(--color-accent) 55%, var(--color-accent-deep))",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4), 0 3px 0 var(--color-accent-deep), 0 6px 14px rgba(20,101,117,0.35)",
          }}>
          {isPending ? "Creando…" : "Crear orden"}
        </button>
      </form>
    </Modal>
  );
}
