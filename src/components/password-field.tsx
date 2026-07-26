"use client";

import { useState } from "react";

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

type PasswordFieldProps = {
  id: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
};

export function PasswordField({ id, name, placeholder, required, autoComplete }: PasswordFieldProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={show ? "text" : "password"}
        required={required}
        autoComplete={autoComplete}
        className="w-full rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3.5 py-2.5 pr-10 text-sm text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-faint)]"
        style={{ boxShadow: "var(--shadow-inset)" }}
        placeholder={placeholder}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
        aria-pressed={show}
        className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[var(--color-ink-faint)] transition-colors hover:bg-[var(--color-panel-raised-hi)] hover:text-[var(--color-ink-soft)]"
      >
        {show ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}
