"use client";

import { useActionState, useState } from "react";
import { authenticate } from "./actions";

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.9 4.24A9.35 9.35 0 0 1 12 4c7 0 11 7 11 7a13.2 13.2 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.53 13.53 0 0 0 1 11s4 7 11 7a9.26 9.26 0 0 0 5.39-1.61" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export default function LoginPage() {
  const [error, formAction, isPending] = useActionState(authenticate, undefined);
  const [showPassword, setShowPassword] = useState(false);

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
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3.5 py-2.5 pr-10 text-sm text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-faint)]"
                  style={{ boxShadow: "var(--shadow-inset)" }}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  aria-pressed={showPassword}
                  className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[var(--color-ink-faint)] transition-colors hover:bg-[var(--color-panel-raised-hi)] hover:text-[var(--color-ink-soft)]"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
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
