import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPrisma } from "@/lib/prisma";
import { CarteraClient } from "./cartera-client";

export default async function CarteraPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { role: string; sucursalId: string | null; sucursalIds: string[]; id: string };
  const prisma = getPrisma();
  if (!prisma) return <p className="p-6 text-[var(--color-ink-soft)]">Error de conexi&oacute;n</p>;

  const isAdmin = user.role === "ADMIN_GENERAL";
  const isFiscal = user.role === "REVISION_FISCAL";
  const filter = isAdmin ? {} : isFiscal ? { sucursalId: { in: user.sucursalIds } } : { sucursalId: user.sucursalId ?? "" };

  const [apartados, ventas] = await Promise.all([
    prisma.apartado.findMany({
      where: { ...filter, status: "ACTIVO", saldoPendiente: { gt: 0 } },
      orderBy: { createdAt: "asc" },
      include: {
        cliente: { select: { id: true, nombre: true, telefono: true } },
        product: { select: { nombre: true, modelo: true } },
      },
    }),
    prisma.sale.findMany({
      where: { ...filter, saldoPendiente: { gt: 0 } },
      orderBy: { createdAt: "asc" },
      include: {
        cliente: { select: { id: true, nombre: true, telefono: true } },
        sucursal: { select: { nombre: true } },
        items: { include: { product: { select: { nombre: true, modelo: true } } } },
      },
    }),
  ]);

  return (
    <div className="p-6">
      <CarteraClient
        apartados={apartados}
        ventas={ventas}
        userId={user.id}
        isAdmin={isAdmin}
        readOnly={isFiscal}
      />
    </div>
  );
}
