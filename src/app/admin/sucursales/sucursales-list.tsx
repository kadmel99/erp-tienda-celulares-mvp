"use client";

import { useActionState, useState } from "react";
import Modal from "@/components/modal";
import { createSucursal, updateSucursal, toggleSucursalActiva } from "./actions";

type Sucursal = {
  id: string;
  nombre: string;
  ciudad: string;
  direccion: string | null;
  activa: boolean;
  createdAt: Date;
};

export function SucursalesList({ sucursales }: { sucursales: Sucursal[] }) {
  const [editando, setEditando] = useState<Sucursal | null>(null);
  const [creando, setCreando] = useState(false);

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-[var(--color-ink)]">Sucursales</h1>
        <button
          onClick={() => setCreando(true)}
          className="rounded-[12px] border-none px-4 py-2 text-sm font-semibold text-white"
          style={{
            background:
              "linear-gradient(180deg, var(--color-accent-hi), var(--color-accent) 55%, var(--color-accent-deep))",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.4), 0 3px 0 var(--color-accent-deep), 0 6px 14px rgba(20,101,117,0.35)",
          }}
        >
          Nueva sucursal
        </button>
      </div>

      <div
        className="overflow-hidden rounded-[14px] border border-[var(--color-line)] bg-[var(--color-panel)]"
        style={{ boxShadow: "var(--shadow-panel)" }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-line)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Ciudad</th>
              <th className="px-4 py-3">Direcci&oacute;n</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {sucursales.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[var(--color-ink-faint)]">
                  No hay sucursales registradas
                </td>
              </tr>
            )}
            {sucursales.map((s) => (
              <tr key={s.id} className="border-b border-[var(--color-line)] last:border-0">
                <td className="px-4 py-3 font-medium text-[var(--color-ink)]">{s.nombre}</td>
                <td className="px-4 py-3 text-[var(--color-ink-soft)]">{s.ciudad}</td>
                <td className="px-4 py-3 text-[var(--color-ink-soft)]">{s.direccion ?? "\u2014"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      s.activa
                        ? "bg-[var(--color-success-soft)] text-[var(--color-success)]"
                        : "bg-[var(--color-danger-soft)] text-[var(--color-danger)]"
                    }`}
                  >
                    {s.activa ? "Activa" : "Inactiva"}
                  </span>
                </td>
                <td className="flex gap-2 px-4 py-3">
                  <button
                    onClick={() => setEditando(s)}
                    className="rounded-[8px] border border-[var(--color-line)] bg-[var(--color-panel-raised)] px-3 py-1 text-xs font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
                  >
                    Editar
                  </button>
                  <button
                    onClick={async () => {
                      await toggleSucursalActiva(s.id, !s.activa);
                    }}
                    className={`rounded-[8px] border px-3 py-1 text-xs font-medium ${
                      s.activa
                        ? "border-[var(--color-danger-soft)] text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)]"
                        : "border-[var(--color-success-soft)] text-[var(--color-success)] hover:bg-[var(--color-success-soft)]"
                    }`}
                  >
                    {s.activa ? "Desactivar" : "Activar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {creando && (
        <SucursalFormModal
          title="Nueva sucursal"
          onClose={() => setCreando(false)}
        />
      )}
      {editando && (
        <SucursalFormModal
          key={editando.id}
          title="Editar sucursal"
          sucursal={editando}
          onClose={() => setEditando(null)}
        />
      )}
    </>
  );
}

function SucursalFormModal({
  title,
  sucursal,
  onClose,
}: {
  title: string;
  sucursal?: Sucursal;
  onClose: () => void;
}) {
  const action = sucursal
    ? updateSucursal.bind(null, sucursal.id)
    : createSucursal;
  const [state, formAction, isPending] = useActionState(async (_prev: unknown, fd: FormData) => {
    const result = await action(fd);
    if (result && "success" in result && result.success) onClose();
    return result;
  }, undefined);

  const error = state && "error" in state ? state.error : undefined;

  return (
    <Modal open title={title} onClose={onClose}>
      <form action={formAction} className="flex flex-col gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
            Nombre
          </label>
          <input
            name="nombre"
            required
            defaultValue={sucursal?.nombre ?? ""}
            className="w-full rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
            style={{ boxShadow: "var(--shadow-inset)" }}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
            Ciudad
          </label>
          <input
            name="ciudad"
            required
            defaultValue={sucursal?.ciudad ?? ""}
            className="w-full rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
            style={{ boxShadow: "var(--shadow-inset)" }}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
            Direcci&oacute;n
          </label>
          <input
            name="direccion"
            defaultValue={sucursal?.direccion ?? ""}
            className="w-full rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
            style={{ boxShadow: "var(--shadow-inset)" }}
          />
        </div>

        {error && (
          <p className="rounded-lg bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="mt-2 rounded-[12px] border-none py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          style={{
            background:
              "linear-gradient(180deg, var(--color-accent-hi), var(--color-accent) 55%, var(--color-accent-deep))",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.4), 0 3px 0 var(--color-accent-deep), 0 6px 14px rgba(20,101,117,0.35)",
          }}
        >
          {isPending ? "Guardando\u2026" : sucursal ? "Actualizar" : "Crear"}
        </button>
      </form>
    </Modal>
  );
}
