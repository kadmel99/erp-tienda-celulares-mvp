import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPrisma } from "@/lib/prisma";
import { startOfDay, endOfDay, subDays } from "date-fns";
import Link from "next/link";

async function getKPIs(
  role: string,
  sucursalId: string | null,
  sucursalIds: string[]
) {
  const prisma = getPrisma();
  if (!prisma) return null;

  const filter =
    role === "ADMIN_GENERAL" ? {} :
    role === "REVISION_FISCAL" ? { sucursalId: { in: sucursalIds } } :
    { sucursalId: sucursalId ?? "" };
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());
  const monthStart = startOfDay(subDays(new Date(), 30));

  const [
    ventasHoy,
    ventasMes,
    totalProductos,
    apartadosActivos,
    sesionCaja,
    sucursales,
    hallazgosAbiertos,
  ] = await Promise.all([
    prisma.sale.findMany({
      where: { ...filter, createdAt: { gte: todayStart, lte: todayEnd } },
      select: { total: true },
    }),
    prisma.sale.findMany({
      where: { ...filter, createdAt: { gte: monthStart } },
      select: { total: true },
    }),
    prisma.product.count({
      where: { ...filter, disponible: true },
    }),
    prisma.apartado.count({
      where: { ...filter, status: "ACTIVO" },
    }),
    prisma.cashRegisterSession.findFirst({
      where: { ...filter, cerradaEn: null },
      orderBy: { abiertaEn: "desc" },
      select: { saldoInicial: true, id: true },
    }),
    prisma.sucursal.findMany({
      where: { activa: true },
      select: { id: true, nombre: true },
    }),
    prisma.hallazgo.count({
      where: { ...filter, status: "ABIERTO" },
    }),
  ]);

  const nombreSucursal =
    sucursalId
      ? sucursales.find((s) => s.id === sucursalId)?.nombre
      : null;

  return {
    totalVentasHoy: ventasHoy.reduce((s, v) => s + Number(v.total), 0),
    cantidadVentasHoy: ventasHoy.length,
    totalVentasMes: ventasMes.reduce((s, v) => s + Number(v.total), 0),
    totalProductos,
    apartadosActivos,
    sesionCajaAbierta: !!sesionCaja,
    nombreSucursal,
    sucursales,
    hallazgosAbiertos,
  };
}

function KpiCard({
  label,
  value,
  sub,
  href,
}: {
  label: string;
  value: string;
  sub?: string;
  href?: string;
}) {
  const content = (
    <div
      className="rounded-[14px] border border-[var(--color-line)] bg-[var(--color-panel)] p-5 transition-shadow hover:shadow-lg"
      style={{ boxShadow: "var(--shadow-panel)" }}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
        {label}
      </p>
      <p
        className="mt-1 text-xl font-bold text-[var(--color-ink)]"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {value}
      </p>
      {sub && (
        <p className="mt-0.5 text-xs text-[var(--color-ink-faint)]">
          {sub}
        </p>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as {
    role: "ADMIN_GENERAL" | "OPERADOR" | "REVISION_FISCAL";
    sucursalId: string | null;
    sucursalIds: string[];
  };

  const kpis = await getKPIs(user.role, user.sucursalId, user.sucursalIds);

  if (!kpis) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <p className="text-[var(--color-ink-soft)]">
          Error al conectar con la base de datos
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[var(--color-ink)]">
            Dashboard
          </h1>
          {kpis.nombreSucursal && (
            <p className="text-sm text-[var(--color-ink-soft)]">
              {kpis.nombreSucursal}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Ventas hoy"
          value={`$${kpis.totalVentasHoy.toLocaleString("es-CO")}`}
          sub={`${kpis.cantidadVentasHoy} transacci${kpis.cantidadVentasHoy === 1 ? "ón" : "ones"}`}
          href="/dashboard/pos"
        />
        <KpiCard
          label="Ventas del mes"
          value={`$${kpis.totalVentasMes.toLocaleString("es-CO")}`}
        />
        <KpiCard
          label="Productos en catálogo"
          value={kpis.totalProductos.toLocaleString("es-CO")}
          sub="Disponibles"
          href="/dashboard/inventario"
        />
        <KpiCard
          label="Apartados activos"
          value={kpis.apartadosActivos.toLocaleString("es-CO")}
          href="/dashboard/apartados"
        />
        <KpiCard
          label="Hallazgos abiertos"
          value={kpis.hallazgosAbiertos.toLocaleString("es-CO")}
          sub="Revisión fiscal"
          href="/dashboard/auditoria"
        />
      </div>
    </div>
  );
}
