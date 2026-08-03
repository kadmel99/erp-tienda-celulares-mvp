"use client";

import { useActionState } from "react";
import { capturarProspecto } from "@/app/dashboard/prospectos/actions";

export function QrForm({ sucursalId }: { sucursalId: string }) {
  const [state, formAction, isPending] = useActionState(async (_prev: unknown, fd: FormData) => {
    fd.set("sucursalId", sucursalId);
    return await capturarProspecto(fd);
  }, undefined);

  const success = state && "success" in state && state.success;
  const error = state && "error" in state ? state.error : undefined;

  if (success) {
    return (
      <div className="text-center">
        <div className="mb-3 text-3xl text-[var(--color-success)]">✓</div>
        <p className="text-sm font-semibold text-[var(--color-ink)]">¡Gracias!</p>
        <p className="text-sm text-[var(--color-ink-soft)]">Te contactaremos pronto.</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <input name="nombre" required placeholder="Nombre completo"
          className="w-full rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-faint)]"
          style={{ boxShadow: "var(--shadow-inset)" }} />
      </div>
      <div>
        <input name="telefono" required placeholder="Tel&eacute;fono"
          className="w-full rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-faint)]"
          style={{ boxShadow: "var(--shadow-inset)" }} />
      </div>
      <div>
        <input name="correo" type="email" placeholder="Correo (opcional)"
          className="w-full rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-faint)]"
          style={{ boxShadow: "var(--shadow-inset)" }} />
      </div>
      <div>
        <input name="productoInteres" placeholder="Producto de inter&eacute;s (opcional)"
          className="w-full rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-faint)]"
          style={{ boxShadow: "var(--shadow-inset)" }} />
      </div>
      {error && (
        <p className="rounded-lg bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]">{error}</p>
      )}
      <button type="submit" disabled={isPending}
        className="w-full rounded-[12px] border-none py-2.5 text-sm font-semibold text-white disabled:opacity-50 btn-skeu-primary">
        {isPending ? "Enviando\u2026" : "Enviar"}
      </button>
    </form>
  );
}
