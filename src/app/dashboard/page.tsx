import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPrisma } from "@/lib/prisma";
import { startOfDay, endOfDay, subDays, subMonths, format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { Sparkline } from "./sparkline";
import { VentasCostoChart } from "./ventas-costo-chart";
import { ApartadosStatusDonut } from "./apartados-status-donut";

const CATEGORIA_LABEL: Record<string, string> = {
  IPHONE: "iPhone",
  IPAD: "iPad",
  APPLE_WATCH: "Apple Watch",
  AIRPODS: "AirPods",
  FORRO: "Forros",
  CARGADOR: "Cargadores",
  VIDRIO: "Vidrios templados",
  ACCESORIO: "Accesorios",
};

function money(n: number) {
  return `$${n.toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

async function getKPIs(
  role: string,
  sucursalId: string | null,
  sucursalIds: string[]
) {
  const prisma = getPrisma();
  if (!prisma) return null;

  const isAdmin = role === "ADMIN_GENERAL";
  const filter =
    isAdmin ? {} :
    role === "REVISION_FISCAL" ? { sucursalId: { in: sucursalIds } } :
    { sucursalId: sucursalId ?? "" };

  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());
  const monthStart = startOfDay(subDays(new Date(), 30));
  const sixMonthsStart = startOfDay(subMonths(new Date(), 5));

  const [
    ventasMesRaw,
    productosDisponibles,
    productosTotal,
    apartadosPorEstadoRaw,
    saleItemsPeriodo,
    sesionCaja,
    sucursales,
    hallazgosAbiertos,
    hallazgosTotal,
    ventasRecientes,
    ventasPorSucursalRaw,
  ] = await Promise.all([
    prisma.sale.findMany({
      where: { ...filter, createdAt: { gte: monthStart } },
      select: { total: true, createdAt: true },
    }),
    prisma.product.count({ where: { ...filter, disponible: true } }),
    prisma.product.count({ where: filter }),
    prisma.apartado.groupBy({ by: ["status"], where: filter, _count: { _all: true } }),
    prisma.saleItem.findMany({
      where: { sale: { ...filter, createdAt: { gte: sixMonthsStart } } },
      select: {
        cantidad: true,
        precioUnit: true,
        sale: { select: { createdAt: true } },
        product: { select: { costo: true, categoria: true } },
      },
    }),
    prisma.cashRegisterSession.findFirst({
      where: { ...filter, cerradaEn: null },
      orderBy: { abiertaEn: "desc" },
      select: { id: true },
    }),
    prisma.sucursal.findMany({
      where: { activa: true },
      select: { id: true, nombre: true },
    }),
    prisma.hallazgo.count({ where: { ...filter, status: "ABIERTO" } }),
    prisma.hallazgo.count({ where: filter }),
    prisma.sale.findMany({
      where: filter,
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        cliente: { select: { nombre: true } },
        items: { include: { product: { select: { nombre: true } } } },
      },
    }),
    isAdmin
      ? prisma.sale.groupBy({ by: ["sucursalId"], where: { createdAt: { gte: monthStart } }, _sum: { total: true } })
      : Promise.resolve([]),
  ]);

  const nombreSucursal =
    sucursalId
      ? sucursales.find((s) => s.id === sucursalId)?.nombre
      : null;

  // Ventas hoy + sparkline de 14 días (derivados del mismo dataset de 30 días)
  const ventasHoyList = ventasMesRaw.filter((v) => v.createdAt >= todayStart && v.createdAt <= todayEnd);
  const totalVentasHoy = ventasHoyList.reduce((s, v) => s + Number(v.total), 0);
  const totalVentasMes = ventasMesRaw.reduce((s, v) => s + Number(v.total), 0);

  const sparklineData = Array.from({ length: 14 }).map((_, i) => {
    const day = startOfDay(subDays(new Date(), 13 - i));
    const dayEnd = endOfDay(day);
    const total = ventasMesRaw
      .filter((v) => v.createdAt >= day && v.createdAt <= dayEnd)
      .reduce((s, v) => s + Number(v.total), 0);
    return { date: day.toISOString(), value: total };
  });

  // Apartados por estado
  const apartadosPorEstado = apartadosPorEstadoRaw.map((a) => ({ status: a.status, count: a._count._all }));
  const apartadosTotal = apartadosPorEstado.reduce((s, a) => s + a.count, 0);
  const apartadosActivos = apartadosPorEstado.find((a) => a.status === "ACTIVO")?.count ?? 0;

  // Ventas vs costo por mes (últimos 6 meses)
  const meses = Array.from({ length: 6 }).map((_, i) => {
    const d = subMonths(new Date(), 5 - i);
    return { key: format(d, "yyyy-MM"), label: format(d, "MMM", { locale: es }) };
  });
  const ventasCostoPorMes = meses.map(({ key, label }) => {
    const items = saleItemsPeriodo.filter((it) => format(it.sale.createdAt, "yyyy-MM") === key);
    const ventas = items.reduce((s, it) => s + Number(it.precioUnit) * it.cantidad, 0);
    const costo = items.reduce((s, it) => s + Number(it.product.costo) * it.cantidad, 0);
    return { mes: label.charAt(0).toUpperCase() + label.slice(1), ventas, costo };
  });

  // Categorías más vendidas (por ingresos, top 5)
  const ingresosPorCategoria = new Map<string, number>();
  for (const it of saleItemsPeriodo) {
    const cat = it.product.categoria;
    const ingreso = Number(it.precioUnit) * it.cantidad;
    ingresosPorCategoria.set(cat, (ingresosPorCategoria.get(cat) ?? 0) + ingreso);
  }
  const categoriasTop = Array.from(ingresosPorCategoria.entries())
    .map(([categoria, ingresos]) => ({ categoria, ingresos }))
    .sort((a, b) => b.ingresos - a.ingresos)
    .slice(0, 5);
  const maxIngresoCategoria = Math.max(1, ...categoriasTop.map((c) => c.ingresos));

  // Ventas por sucursal (solo admin, últimos 30 días)
  const ventasPorSucursal = ventasPorSucursalRaw
    .map((v) => ({
      sucursalId: v.sucursalId,
      nombre: sucursales.find((s) => s.id === v.sucursalId)?.nombre ?? "—",
      total: Number(v._sum.total ?? 0),
    }))
    .sort((a, b) => b.total - a.total);
  const maxVentaSucursal = Math.max(1, ...ventasPorSucursal.map((v) => v.total));

  return {
    totalVentasHoy,
    cantidadVentasHoy: ventasHoyList.length,
    totalVentasMes,
    sparklineData,
    productosDisponibles,
    productosTotal,
    apartadosActivos,
    apartadosTotal,
    apartadosPorEstado,
    sesionCajaAbierta: !!sesionCaja,
    nombreSucursal,
    hallazgosAbiertos,
    hallazgosTotal,
    ventasCostoPorMes,
    categoriasTop,
    maxIngresoCategoria,
    ventasRecientes,
    ventasPorSucursal,
    maxVentaSucursal,
    isAdmin,
  };
}

function KpiCard({
  label,
  value,
  sub,
  href,
  chart,
}: {
  label: string;
  value: string;
  sub?: string;
  href?: string;
  chart?: React.ReactNode;
}) {
  const content = (
    <div
      className="rounded-[14px] border border-[var(--color-line)] bg-[var(--color-panel)] p-5 transition-shadow hover:shadow-lg"
      style={{ boxShadow: "var(--shadow-panel)" }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
            {label}
          </p>
          <p className="mt-1 truncate text-xl font-bold text-[var(--color-ink)]" style={{ fontVariantNumeric: "tabular-nums" }}>
            {value}
          </p>
          {sub && <p className="mt-0.5 truncate text-xs text-[var(--color-ink-faint)]">{sub}</p>}
        </div>
        {chart && <div className="h-12 w-24 shrink-0">{chart}</div>}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

function Panel({ title, href, children }: { title: string; href?: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-[14px] border border-[var(--color-line)] bg-[var(--color-panel)] p-5"
      style={{ boxShadow: "var(--shadow-panel)" }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--color-ink)]">{title}</h2>
        {href && (
          <Link href={href} className="text-xs font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-deep)]">
            Ver todo
          </Link>
        )}
      </div>
      {children}
    </div>
  );
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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
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
        {user.role !== "REVISION_FISCAL" && (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              kpis.sesionCajaAbierta
                ? "bg-[var(--color-success-soft)] text-[var(--color-success)]"
                : "bg-[var(--color-danger-soft)] text-[var(--color-danger)]"
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {kpis.sesionCajaAbierta ? "Caja abierta" : "Caja cerrada"}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Ventas hoy"
          value={money(kpis.totalVentasHoy)}
          sub={`${kpis.cantidadVentasHoy} transacci${kpis.cantidadVentasHoy === 1 ? "ón" : "ones"} · ${money(kpis.totalVentasMes)} este mes`}
          href="/dashboard/pos"
          chart={<Sparkline data={kpis.sparklineData} />}
        />
        <KpiCard
          label="Productos disponibles"
          value={kpis.productosDisponibles.toLocaleString("es-CO")}
          sub={`${kpis.productosTotal.toLocaleString("es-CO")} en catálogo`}
          href="/dashboard/inventario"
        />
        <KpiCard
          label="Apartados activos"
          value={kpis.apartadosActivos.toLocaleString("es-CO")}
          sub={`${kpis.apartadosTotal.toLocaleString("es-CO")} históricos`}
          href="/dashboard/apartados"
        />
        <KpiCard
          label="Hallazgos abiertos"
          value={kpis.hallazgosAbiertos.toLocaleString("es-CO")}
          sub={`de ${kpis.hallazgosTotal.toLocaleString("es-CO")} registrados`}
          href="/dashboard/auditoria"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel title="Ventas vs. costo — últimos 6 meses">
            <VentasCostoChart data={kpis.ventasCostoPorMes} />
          </Panel>
        </div>
        <Panel title="Apartados por estado">
          <ApartadosStatusDonut data={kpis.apartadosPorEstado} />
        </Panel>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Categorías más vendidas">
          {kpis.categoriasTop.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-faint)]">Sin ventas en los últimos 6 meses</p>
          ) : (
            <div className="flex flex-col gap-3">
              {kpis.categoriasTop.map((c) => (
                <div key={c.categoria}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-[var(--color-ink-soft)]">{CATEGORIA_LABEL[c.categoria] ?? c.categoria}</span>
                    <span className="font-semibold text-[var(--color-ink)]" style={{ fontVariantNumeric: "tabular-nums" }}>
                      {money(c.ingresos)}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-panel-raised)]">
                    <div
                      className="h-full rounded-full bg-[var(--color-accent)]"
                      style={{ width: `${Math.max(4, Math.round((c.ingresos / kpis.maxIngresoCategoria) * 100))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Ventas recientes" href="/dashboard/pos">
          {kpis.ventasRecientes.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-faint)]">Sin ventas registradas</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-line)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
                    <th className="pb-2 pr-2">Cliente</th>
                    <th className="pb-2 pr-2">Producto</th>
                    <th className="pb-2 pr-2">Total</th>
                    <th className="pb-2">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {kpis.ventasRecientes.map((v) => (
                    <tr key={v.id} className="border-b border-[var(--color-line)] last:border-0">
                      <td className="py-2 pr-2 text-[var(--color-ink)]">{v.cliente?.nombre ?? "—"}</td>
                      <td className="py-2 pr-2 truncate text-[var(--color-ink-soft)]">
                        {v.items[0]?.product.nombre ?? "—"}{v.items.length > 1 ? ` +${v.items.length - 1}` : ""}
                      </td>
                      <td className="py-2 pr-2 font-semibold text-[var(--color-ink)]" style={{ fontVariantNumeric: "tabular-nums" }}>
                        {money(Number(v.total))}
                      </td>
                      <td className="py-2 text-xs text-[var(--color-ink-faint)]">
                        {new Date(v.createdAt).toLocaleDateString("es-CO")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>

      {kpis.isAdmin && kpis.ventasPorSucursal.length > 0 && (
        <div className="mt-4">
          <Panel title="Ventas por sucursal — últimos 30 días">
            <div className="flex flex-col gap-3">
              {kpis.ventasPorSucursal.map((v) => (
                <div key={v.sucursalId}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-[var(--color-ink-soft)]">{v.nombre}</span>
                    <span className="font-semibold text-[var(--color-ink)]" style={{ fontVariantNumeric: "tabular-nums" }}>
                      {money(v.total)}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-panel-raised)]">
                    <div
                      className="h-full rounded-full bg-[var(--color-accent)]"
                      style={{ width: `${Math.max(4, Math.round((v.total / kpis.maxVentaSucursal) * 100))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}
