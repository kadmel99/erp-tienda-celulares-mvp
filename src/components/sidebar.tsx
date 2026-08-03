"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  label: string;
  href: string;
};

const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Inventario", href: "/dashboard/inventario" },
  { label: "POS", href: "/dashboard/pos" },
  { label: "Apartados", href: "/dashboard/apartados" },
  { label: "Clientes", href: "/dashboard/clientes" },
  { label: "Cartera", href: "/dashboard/cartera" },
  { label: "Caja", href: "/dashboard/caja" },
  { label: "Facturaci\u00f3n", href: "/dashboard/facturacion" },
  { label: "Garant\u00edas", href: "/dashboard/garantias" },
  { label: "Auditor\u00eda", href: "/dashboard/auditoria" },
  { label: "Admin", href: "/admin" },
];

const operatorNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Inventario", href: "/dashboard/inventario" },
  { label: "POS", href: "/dashboard/pos" },
  { label: "Apartados", href: "/dashboard/apartados" },
  { label: "Clientes", href: "/dashboard/clientes" },
  { label: "Caja", href: "/dashboard/caja" },
  { label: "Garant\u00edas", href: "/dashboard/garantias" },
];

const fiscalNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Inventario", href: "/dashboard/inventario" },
  { label: "Caja", href: "/dashboard/caja" },
  { label: "Apartados", href: "/dashboard/apartados" },
  { label: "Facturaci\u00f3n", href: "/dashboard/facturacion" },
  { label: "Auditor\u00eda", href: "/dashboard/auditoria" },
];

type SidebarProps = {
  role: "ADMIN_GENERAL" | "OPERADOR" | "REVISION_FISCAL";
};

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const items = role === "ADMIN_GENERAL" ? adminNav : role === "REVISION_FISCAL" ? fiscalNav : operatorNav;

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-[var(--color-line)] bg-[var(--color-panel)]">
      <div className="flex shrink-0 items-center gap-2.5 border-b border-[var(--color-line)] px-4 py-4">
        <div
          className="h-8 w-8 overflow-hidden rounded-full border border-[var(--color-line-strong)]"
          style={{
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.6), 0 3px 8px rgba(38,36,32,0.28)",
          }}
        >
          <img
            src="/logo-zona-ios.png"
            alt=""
            className="h-full w-full object-cover"
            style={{ objectPosition: "50% 38%" }}
          />
        </div>
        <span className="text-sm font-semibold text-[var(--color-ink)]">
          Zona iOS
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        {items.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" &&
              pathname.startsWith(item.href + "/")) ||
            (item.href === item.href &&
              pathname === item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mb-0.5 flex items-center rounded-[10px] px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[var(--color-accent-soft)] text-[var(--color-accent-deep)]"
                  : "text-[var(--color-ink-soft)] hover:bg-[var(--color-panel-raised)] hover:text-[var(--color-ink)]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
