import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPrisma } from "@/lib/prisma";
import { ServicioTecnicoClient } from "./servicio-tecnico-client";

export default async function ServicioTecnicoPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { id: string; role: string; sucursalId: string | null };
  if (user.role === "REVISION_FISCAL") redirect("/dashboard");

  const prisma = getPrisma();
  if (!prisma) return <p className="p-6 text-[var(--color-ink-soft)]">Error de conexi&oacute;n</p>;

  const isAdmin = user.role === "ADMIN_GENERAL";
  const filter = isAdmin ? {} : { sucursalId: user.sucursalId ?? "" };

  const [ordenes, clientes, productos, tecnicos] = await Promise.all([
    prisma.servicioTecnico.findMany({
      where: filter,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        cliente: { select: { id: true, nombre: true, telefono: true } },
        sucursal: { select: { nombre: true } },
        repuestos: true,
        seguimientos: { orderBy: { createdAt: "desc" } },
      },
    }),
    prisma.cliente.findMany({ orderBy: { nombre: "asc" } }),
    prisma.product.findMany({
      where: { ...filter, disponible: true, cantidad: { gt: 0 } },
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true, modelo: true, sku: true, costo: true, sucursalId: true },
    }),
    prisma.usuario.findMany({
      where: isAdmin ? { activo: true } : { sucursalId: user.sucursalId ?? "", activo: true },
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
  ]);

  const sucursalId = user.sucursalId ?? (isAdmin && productos.length > 0 ? productos[0].sucursalId : "");

  return (
    <div className="p-6">
      <ServicioTecnicoClient
        ordenes={ordenes}
        clientes={clientes}
        productos={productos}
        tecnicos={tecnicos}
        sucursalId={sucursalId}
        userId={user.id}
        isAdmin={isAdmin}
      />
    </div>
  );
}
