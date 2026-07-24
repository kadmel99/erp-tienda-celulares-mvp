"use client";

import { useActionState } from "react";
import { authenticate } from "./actions";

export default function LoginPage() {
  const [error, formAction, isPending] = useActionState(authenticate, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div
          className="rounded-[14px] border border-[var(--color-line)] bg-[var(--color-panel)] p-8"
          style={{ boxShadow: "var(--shadow-panel)" }}
        >
          <div className="mb-8 flex flex-col items-center gap-3">
            <div
              className="h-14 w-14 overflow-hidden rounded-full border border-[var(--color-line-strong)]"
              style={{
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.6), 0 3px 8px rgba(38,36,32,0.28)",
              }}
            >
              <img
                src="/logo-zona-ios.png"
                alt="Zona iOS"
                className="h-full w-full object-cover"
                style={{ objectPosition: "50% 38%" }}
              />
            </div>
            <h1 className="text-lg font-semibold text-[var(--color-ink)]">
              Zona iOS
            </h1>
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
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-faint)]"
                style={{ boxShadow: "var(--shadow-inset)" }}
                placeholder="••••••••"
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
              className="mt-2 w-full rounded-[12px] border-none py-2.5 text-sm font-semibold text-white outline-none disabled:opacity-50"
              style={{
                background:
                  "linear-gradient(180deg, var(--color-accent-hi), var(--color-accent) 55%, var(--color-accent-deep))",
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.4), 0 3px 0 var(--color-accent-deep), 0 6px 14px rgba(20,101,117,0.35)",
              }}
            >
              {isPending ? "Ingresando\u2026" : "Ingresar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
