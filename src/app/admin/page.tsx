import Link from "next/link";

export default function AdminPage() {
  return (
    <div className="p-6">
      <h1 className="mb-6 text-lg font-semibold text-[var(--color-ink)]">
        Administraci&oacute;n
      </h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/admin/sucursales"
          className="rounded-[14px] border border-[var(--color-line)] bg-[var(--color-panel)] p-5 transition-shadow hover:shadow-lg"
          style={{ boxShadow: "var(--shadow-panel)" }}
        >
          <h2 className="text-base font-semibold text-[var(--color-ink)]">
            Sucursales
          </h2>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
            Gestionar sucursales del sistema
          </p>
        </Link>
        <Link
          href="/admin/usuarios"
          className="rounded-[14px] border border-[var(--color-line)] bg-[var(--color-panel)] p-5 transition-shadow hover:shadow-lg"
          style={{ boxShadow: "var(--shadow-panel)" }}
        >
          <h2 className="text-base font-semibold text-[var(--color-ink)]">
            Usuarios
          </h2>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
            Gestionar usuarios y operadores
          </p>
        </Link>
      </div>
    </div>
  );
}
