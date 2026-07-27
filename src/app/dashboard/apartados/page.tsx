import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPrisma } from "@/lib/prisma";
import { ApartadosClient } from "./apartados-client";

export default async function ApartadosPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { role: string; sucursalId: string | null; sucursalIds: string[]; id: string };
  const prisma = getPrisma();
  if (!prisma) return <p className="p-6 text-[var(--color-ink-soft)]">Error de conexi&oacute;n</p>;

  const isAdmin = user.role === "ADMIN_GENERAL";
  const isFiscal = user.role === "REVISION_FISCAL";
  const filter = isAdmin ? {} : isFiscal ? { sucursalId: { in: user.sucursalIds } } : { sucursalId: user.sucursalId ?? "" };

  const [apartados, productos, clientes] = await Promise.all([
    prisma.apartado.findMany({
      where: filter,
      orderBy: { createdAt: "desc" },
      include: {
        cliente: { select: { id: true, nombre: true, telefono: true, correo: true } },
        product: { select: { id: true, nombre: true, modelo: true, sku: true, precioVenta: true, sucursalId: true } },
        abonos: { orderBy: { createdAt: "desc" } },
        seguimientos: { orderBy: { createdAt: "desc" }, take: 3 },
      },
    }),
    prisma.product.findMany({
      where: { ...filter, disponible: true, cantidad: { gt: 0 } },
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true, modelo: true, sku: true, precioVenta: true, sucursalId: true },
    }),
    prisma.cliente.findMany({ orderBy: { nombre: "asc" } }),
  ]);

  const sucursalId = user.sucursalId ?? (isAdmin && productos.length > 0 ? productos[0].sucursalId : "");

  return (
    <div className="p-6">
      <ApartadosClient
        apartados={apartados}
        productos={productos}
        clientes={clientes}
        sucursalId={sucursalId}
        userId={user.id}
        readOnly={isFiscal}
      />
    </div>
  );
}
