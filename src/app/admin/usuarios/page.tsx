import { getPrisma } from "@/lib/prisma";
import { UsuariosList } from "./usuarios-list";

export default async function UsuariosPage() {
  const prisma = getPrisma();
  if (!prisma) return <p className="p-6 text-[var(--color-ink-soft)]">Error de conexi&oacute;n</p>;

  const [usuarios, sucursales] = await Promise.all([
    prisma.usuario.findMany({
      orderBy: { nombre: "asc" },
      include: {
        sucursal: { select: { nombre: true } },
        sucursalesAsignadas: { include: { sucursal: { select: { id: true, nombre: true } } } },
      },
    }),
    prisma.sucursal.findMany({
      where: { activa: true },
      orderBy: { nombre: "asc" },
    }),
  ]);

  return (
    <div className="p-6">
      <PermisosPorRol />
      <UsuariosList usuarios={usuarios} sucursales={sucursales} />
    </div>
  );
}

const PERMISOS = [
  {
    rol: "Administrador General",
    alcance: "Todas las sucursales",
    puede: "Todo el sistema: POS, inventario, apartados, caja, facturación, garantías, auditoría y administración (usuarios/sucursales).",
  },
  {
    rol: "Operador",
    alcance: "Su sucursal asignada (una sola)",
    puede: "POS, inventario, apartados, caja y garantías — solo de su propia sucursal. Sin acceso a Admin, Facturación ni Auditoría.",
  },
  {
    rol: "Revisión Fiscal",
    alcance: "Una o varias sucursales asignadas",
    puede: "Solo lectura de inventario, caja, apartados y facturación de sus sucursales asignadas. No puede vender, editar inventario, ni abrir/cerrar caja. Registra hallazgos y descarga reportes en Auditoría.",
  },
] as const;

function PermisosPorRol() {
  return (
    <div className="mb-6 overflow-hidden rounded-[14px] border border-[var(--color-line)] bg-[var(--color-panel)]"
      style={{ boxShadow: "var(--shadow-panel)" }}>
      <div className="border-b border-[var(--color-line)] px-4 py-3">
        <h2 className="text-sm font-semibold text-[var(--color-ink)]">Permisos por rol</h2>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--color-line)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
            <th className="px-4 py-2">Rol</th>
            <th className="px-4 py-2">Alcance de sucursales</th>
            <th className="px-4 py-2">Qué puede hacer</th>
          </tr>
        </thead>
        <tbody>
          {PERMISOS.map((p) => (
            <tr key={p.rol} className="border-b border-[var(--color-line)] last:border-0">
              <td className="px-4 py-3 align-top font-medium text-[var(--color-ink)]">{p.rol}</td>
              <td className="px-4 py-3 align-top text-[var(--color-ink-soft)]">{p.alcance}</td>
              <td className="px-4 py-3 align-top text-[var(--color-ink-soft)]">{p.puede}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
