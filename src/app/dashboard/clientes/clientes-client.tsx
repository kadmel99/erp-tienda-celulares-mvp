"use client";

import { useActionState, useMemo, useState } from "react";
import Modal from "@/components/modal";
import { NewClientModal } from "@/components/new-client-modal";
import { updateCliente } from "./actions";

type Cliente = {
  id: string;
  nombre: string;
  telefono: string | null;
  correo: string | null;
  ciudad: string | null;
  createdAt: Date;
  _count: { ventas: number; apartados: number };
};

type Props = { clientes: Cliente[] };

export function ClientesClient({ clientes: clientesIniciales }: Props) {
  const [clientes, setClientes] = useState(clientesIniciales);
  const [busqueda, setBusqueda] = useState("");
  const [creando, setCreando] = useState(false);
  const [editando, setEditando] = useState<Cliente | null>(null);

  const filtrados = useMemo(() => {
    const q = busqueda.toLowerCase();
    if (!q) return clientes;
    return clientes.filter((c) =>
      c.nombre.toLowerCase().includes(q) ||
      c.telefono?.toLowerCase().includes(q) ||
      c.correo?.toLowerCase().includes(q) ||
      c.ciudad?.toLowerCase().includes(q)
    );
  }, [clientes, busqueda]);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-[var(--color-ink)]">Clientes</h1>
          <p className="text-sm text-[var(--color-ink-soft)]">{clientes.length} registrados</p>
        </div>
        <button
          onClick={() => setCreando(true)}
          className="rounded-[12px] border-none px-4 py-2 text-sm font-semibold text-white"
          style={{
            background: "linear-gradient(180deg, var(--color-accent-hi), var(--color-accent) 55%, var(--color-accent-deep))",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4), 0 3px 0 var(--color-accent-deep), 0 6px 14px rgba(20,101,117,0.35)",
          }}
        >
          Nuevo cliente
        </button>
      </div>

      <div className="mb-4">
        <input
          placeholder="Buscar por nombre, tel&eacute;fono, correo o ciudad..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full max-w-md rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3.5 py-2 text-sm text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-faint)]"
          style={{ boxShadow: "var(--shadow-inset)" }}
        />
      </div>

      <div className="overflow-hidden rounded-[14px] border border-[var(--color-line)] bg-[var(--color-panel)]"
        style={{ boxShadow: "var(--shadow-panel)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-line)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Tel&eacute;fono</th>
              <th className="px-4 py-3">Correo</th>
              <th className="px-4 py-3">Ciudad</th>
              <th className="px-4 py-3">Compras</th>
              <th className="px-4 py-3">Apartados</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-[var(--color-ink-faint)]">
                  No se encontraron clientes
                </td>
              </tr>
            )}
            {filtrados.map((c) => (
              <tr key={c.id} className="border-b border-[var(--color-line)] last:border-0">
                <td className="px-4 py-3 font-medium text-[var(--color-ink)]">{c.nombre}</td>
                <td className="px-4 py-3 text-[var(--color-ink-soft)]">{c.telefono ?? "—"}</td>
                <td className="px-4 py-3 text-[var(--color-ink-soft)]">{c.correo ?? "—"}</td>
                <td className="px-4 py-3 text-[var(--color-ink-soft)]">{c.ciudad ?? "—"}</td>
                <td className="px-4 py-3 text-[var(--color-ink)]" style={{ fontVariantNumeric: "tabular-nums" }}>{c._count.ventas}</td>
                <td className="px-4 py-3 text-[var(--color-ink)]" style={{ fontVariantNumeric: "tabular-nums" }}>{c._count.apartados}</td>
                <td className="px-4 py-3">
                  <button onClick={() => setEditando(c)}
                    className="rounded-[8px] border border-[var(--color-line)] bg-[var(--color-panel-raised)] px-3 py-1 text-xs font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {creando && (
        <NewClientModal
          onClose={() => setCreando(false)}
          onCreated={(c) => {
            setClientes((prev) => [...prev, { ...c, createdAt: new Date(), _count: { ventas: 0, apartados: 0 } }].sort((a, b) => a.nombre.localeCompare(b.nombre)));
            setCreando(false);
          }}
        />
      )}
      {editando && (
        <EditClientModal
          cliente={editando}
          onClose={() => setEditando(null)}
          onUpdated={(updated) => {
            setClientes((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
            setEditando(null);
          }}
        />
      )}
    </>
  );
}

function EditClientModal({ cliente, onClose, onUpdated }: {
  cliente: Cliente;
  onClose: () => void;
  onUpdated: (c: { id: string; nombre: string; telefono: string | null; correo: string | null; ciudad: string | null }) => void;
}) {
  const action = updateCliente.bind(null, cliente.id);
  const [state, formAction, isPending] = useActionState(async (_prev: unknown, fd: FormData) => {
    const result = await action(fd);
    if (result && "success" in result && result.success) {
      onUpdated({
        id: cliente.id,
        nombre: fd.get("nombre") as string,
        telefono: (fd.get("telefono") as string) || null,
        correo: (fd.get("correo") as string) || null,
        ciudad: (fd.get("ciudad") as string) || null,
      });
    }
    return result;
  }, undefined);

  const error = state && "error" in state ? state.error : undefined;

  return (
    <Modal open title="Editar cliente" onClose={onClose}>
      <form action={formAction} className="flex flex-col gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Nombre</label>
          <input name="nombre" required defaultValue={cliente.nombre}
            className="w-full rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
            style={{ boxShadow: "var(--shadow-inset)" }} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Tel&eacute;fono</label>
          <input name="telefono" defaultValue={cliente.telefono ?? ""}
            className="w-full rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
            style={{ boxShadow: "var(--shadow-inset)" }} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Correo</label>
          <input name="correo" type="email" defaultValue={cliente.correo ?? ""}
            className="w-full rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
            style={{ boxShadow: "var(--shadow-inset)" }} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Ciudad</label>
          <input name="ciudad" defaultValue={cliente.ciudad ?? ""}
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
          {isPending ? "Guardando…" : "Guardar cambios"}
        </button>
      </form>
    </Modal>
  );
}
