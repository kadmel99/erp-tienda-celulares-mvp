"use client";

import { useActionState } from "react";
import { authenticate } from "./actions";
import { PasswordField } from "@/components/password-field";

export default function LoginPage() {
  const [error, formAction, isPending] = useActionState(authenticate, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div
          className="rounded-[16px] border border-[var(--color-line)] bg-[var(--color-panel)] p-9"
          style={{ boxShadow: "var(--shadow-panel)" }}
        >
          <div className="mb-8 flex flex-col items-center gap-3">
            <div
              className="w-36 overflow-hidden rounded-[18px] border border-[var(--color-line-strong)]"
              style={{
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.6), 0 3px 8px rgba(38,36,32,0.28), 0 14px 26px rgba(38,36,32,0.22)",
              }}
            >
              <img
                src="/logo-zona-ios.png"
                alt="Zona iOS — Venta de iPhone y accesorios"
                className="block h-auto w-full"
              />
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <h1 className="text-lg font-semibold text-[var(--color-ink)]">Zona iOS</h1>
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink-faint)]">
                Venta de iPhone y accesorios
              </p>
            </div>
          </div>

          <form action={formAction} className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]"
              >
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-faint)]"
                style={{ boxShadow: "var(--shadow-inset)" }}
                placeholder="admin@tienda.com"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]"
              >
                Contraseña
              </label>
              <PasswordField id="password" name="password" placeholder="••••••••" required autoComplete="current-password" />
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
              {isPending ? "Ingresando…" : "Ingresar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
