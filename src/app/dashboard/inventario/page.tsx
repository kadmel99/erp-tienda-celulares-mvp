import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPrisma } from "@/lib/prisma";
import { InventarioList } from "./inventario-list";

export default async function InventarioPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { id: string; role: string; sucursalId: string | null; sucursalIds: string[] };
  const prisma = getPrisma();
  if (!prisma) return <p className="p-6 text-[var(--color-ink-soft)]">Error de conexi&oacute;n</p>;

  const isAdmin = user.role === "ADMIN_GENERAL";
  const isFiscal = user.role === "REVISION_FISCAL";
  const filter = isAdmin ? {} : isFiscal ? { sucursalId: { in: user.sucursalIds } } : { sucursalId: user.sucursalId ?? "" };

  const [products, sucursales] = await Promise.all([
    prisma.product.findMany({
      where: filter,
      orderBy: { createdAt: "desc" },
      include: { sucursal: { select: { nombre: true } } },
    }),
    isAdmin ? prisma.sucursal.findMany({ where: { activa: true }, orderBy: { nombre: "asc" } }) : Promise.resolve([]),
  ]);

  return (
    <div className="p-6">
      <InventarioList products={products} sucursales={sucursales} isAdmin={isAdmin} userSucursalId={user.sucursalId} userId={user.id} readOnly={isFiscal} />
    </div>
  );
}
