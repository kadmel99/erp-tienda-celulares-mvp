"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  userName: string;
  roleLabel: string;
};

export function UserMenu({ userName, roleLabel }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const initial = userName.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 rounded-[10px] px-2 py-1.5 transition-colors hover:bg-[var(--color-panel-raised)]"
      >
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--color-line-strong)] bg-[var(--color-accent-soft)] text-sm font-semibold text-[var(--color-accent-deep)]"
          style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6), 0 3px 8px rgba(38,36,32,0.28)" }}
        >
          {initial}
        </div>
        <div className="hidden text-left sm:block">
          <div className="max-w-[160px] truncate text-sm font-medium text-[var(--color-ink)]">{userName}</div>
          <div className="text-xs text-[var(--color-ink-faint)]">{roleLabel}</div>
        </div>
        <span aria-hidden className="text-xs text-[var(--color-ink-faint)]">&#9662;</span>
      </button>

      {open && (
        <div
          className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-[12px] border border-[var(--color-line)] bg-[var(--color-panel)]"
          style={{ boxShadow: "var(--shadow-panel)" }}
        >
          <div className="border-b border-[var(--color-line)] px-3.5 py-3">
            <div className="truncate text-sm font-medium text-[var(--color-ink)]">{userName}</div>
            <div className="text-xs text-[var(--color-ink-faint)]">{roleLabel}</div>
          </div>
          <form action="/api/auth/signout" method="POST">
            <input type="hidden" name="redirectTo" value="/login" />
            <button
              type="submit"
              className="w-full px-3.5 py-2.5 text-left text-sm font-medium text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger)]"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
