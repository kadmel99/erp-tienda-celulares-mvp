"use client";

import { useActionState, useState } from "react";
import Modal from "@/components/modal";
import { createUsuario, updateUsuario, toggleUsuarioActivo } from "./actions";

type Usuario = {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  sucursalId: string | null;
  activo: boolean;
  sucursal: { nombre: string } | null;
};

type Sucursal = {
  id: string;
  nombre: string;
};

export function UsuariosList({
  usuarios,
  sucursales,
}: {
  usuarios: Usuario[];
  sucursales: Sucursal[];
}) {
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [creando, setCreando] = useState(false);

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-[var(--color-ink)]">Usuarios</h1>
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
          Nuevo usuario
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
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Sucursal</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[var(--color-ink-faint)]">
                  No hay usuarios registrados
                </td>
              </tr>
            )}
            {usuarios.map((u) => (
              <tr key={u.id} className="border-b border-[var(--color-line)] last:border-0">
                <td className="px-4 py-3 font-medium text-[var(--color-ink)]">{u.nombre}</td>
                <td className="px-4 py-3 text-[var(--color-ink-soft)]">{u.email}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-[var(--color-accent-soft)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-accent-deep)]">
                    {u.rol === "ADMIN_GENERAL" ? "Admin" : "Operador"}
                  </span>
                </td>
                <td className="px-4 py-3 text-[var(--color-ink-soft)]">{u.sucursal?.nombre ?? "\u2014"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      u.activo
                        ? "bg-[var(--color-success-soft)] text-[var(--color-success)]"
                        : "bg-[var(--color-danger-soft)] text-[var(--color-danger)]"
                    }`}
                  >
                    {u.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="flex gap-2 px-4 py-3">
                  <button
                    onClick={() => setEditando(u)}
                    className="rounded-[8px] border border-[var(--color-line)] bg-[var(--color-panel-raised)] px-3 py-1 text-xs font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
                  >
                    Editar
                  </button>
                  <button
                    onClick={async () => {
                      await toggleUsuarioActivo(u.id, !u.activo);
                    }}
                    className={`rounded-[8px] border px-3 py-1 text-xs font-medium ${
                      u.activo
                        ? "border-[var(--color-danger-soft)] text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)]"
                        : "border-[var(--color-success-soft)] text-[var(--color-success)] hover:bg-[var(--color-success-soft)]"
                    }`}
                  >
                    {u.activo ? "Desactivar" : "Activar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {creando && (
        <UsuarioFormModal
          title="Nuevo usuario"
          sucursales={sucursales}
          onClose={() => setCreando(false)}
        />
      )}
      {editando && (
        <UsuarioFormModal
          key={editando.id}
          title="Editar usuario"
          usuario={editando}
          sucursales={sucursales}
          onClose={() => setEditando(null)}
        />
      )}
    </>
  );
}

function UsuarioFormModal({
  title,
  usuario,
  sucursales,
  onClose,
}: {
  title: string;
  usuario?: Usuario;
  sucursales: Sucursal[];
  onClose: () => void;
}) {
  const action = usuario
    ? updateUsuario.bind(null, usuario.id)
    : createUsuario;
  const [state, formAction, isPending] = useActionState(async (_prev: unknown, fd: FormData) => {
    const result = await action(fd);
    if (result && "success" in result && result.success) onClose();
    return result;
  }, undefined);

  const error = state && "error" in state ? state.error : undefined;
  const [rol, setRol] = useState(usuario?.rol ?? "OPERADOR");

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
            defaultValue={usuario?.nombre ?? ""}
            className="w-full rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
            style={{ boxShadow: "var(--shadow-inset)" }}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
            Email
          </label>
          <input
            name="email"
            type="email"
            required
            defaultValue={usuario?.email ?? ""}
            className="w-full rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
            style={{ boxShadow: "var(--shadow-inset)" }}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
            Contrase&ntilde;a {usuario ? "(dejar vac&iacute;o para mantener)" : ""}
          </label>
          <input
            name="password"
            type="password"
            required={!usuario}
            className="w-full rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
            style={{ boxShadow: "var(--shadow-inset)" }}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
            Rol
          </label>
          <select
            name="rol"
            required
            defaultValue={usuario?.rol ?? "OPERADOR"}
            onChange={(e) => setRol(e.target.value)}
            className="w-full rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
            style={{ boxShadow: "var(--shadow-inset)" }}
          >
            <option value="OPERADOR">Operador</option>
            <option value="ADMIN_GENERAL">Administrador General</option>
          </select>
        </div>
        {rol === "OPERADOR" && (
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
              Sucursal
            </label>
            <select
              name="sucursalId"
              required={rol === "OPERADOR"}
              defaultValue={usuario?.sucursalId ?? ""}
              className="w-full rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
              style={{ boxShadow: "var(--shadow-inset)" }}
            >
              <option value="">Seleccionar sucursal</option>
              {sucursales.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>
        )}

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
          {isPending ? "Guardando\u2026" : usuario ? "Actualizar" : "Crear"}
        </button>
      </form>
    </Modal>
  );
}
