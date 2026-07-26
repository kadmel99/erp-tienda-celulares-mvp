"use client";

import { useActionState } from "react";
import Link from "next/link";
import { cambiarPassword } from "./actions";
import { PasswordField } from "@/components/password-field";

export function CambiarPasswordForm({ forzado }: { forzado: boolean }) {
  const [state, formAction, isPending] = useActionState(async (_prev: unknown, fd: FormData) => {
    return cambiarPassword(fd);
  }, undefined);

  const error = state && "error" in state ? state.error : undefined;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label
          htmlFor="passwordActual"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]"
        >
          Contraseña actual
        </label>
        <PasswordField id="passwordActual" name="passwordActual" placeholder="••••••••" required autoComplete="current-password" />
      </div>
      <div>
        <label
          htmlFor="passwordNueva"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]"
        >
          Nueva contraseña
        </label>
        <PasswordField id="passwordNueva" name="passwordNueva" placeholder="Mínimo 8 caracteres" required autoComplete="new-password" />
      </div>
      <div>
        <label
          htmlFor="passwordConfirmar"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]"
        >
          Confirmar nueva contraseña
        </label>
        <PasswordField id="passwordConfirmar" name="passwordConfirmar" placeholder="••••••••" required autoComplete="new-password" />
      </div>

      {error && (
        <p className="rounded-lg bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="btn-skeu-primary mt-2 w-full rounded-[12px] border-none py-2.5 text-sm font-semibold text-white outline-none"
      >
        {isPending ? "Guardando…" : "Guardar contraseña"}
      </button>

      {!forzado && (
        <Link
          href="/dashboard"
          className="text-center text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
        >
          Cancelar
        </Link>
      )}
    </form>
  );
}
