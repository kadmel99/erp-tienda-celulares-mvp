import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPrisma } from "@/lib/prisma";
import { MovimientosList } from "./movimientos-list";

export default async function MovimientosPage(props: { searchParams?: Promise<{ productoId?: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { role: string; sucursalId: string | null; id: string };
  const prisma = getPrisma();
  if (!prisma) return <p className="p-6 text-[var(--color-ink-soft)]">Error de conexi&oacute;n</p>;

  const searchParams = await props.searchParams;
  const productoId = searchParams?.productoId;

  const isAdmin = user.role === "ADMIN_GENERAL";
  const sucursalFilter = isAdmin ? {} : { sucursalId: user.sucursalId ?? "" };

  const filter: Record<string, unknown> = {};
  if (productoId) filter.productId = productoId;
  if (!isAdmin) filter.product = sucursalFilter;

  const [movements, products] = await Promise.all([
    prisma.inventoryMovement.findMany({
      where: filter,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        product: { select: { id: true, nombre: true, sku: true, sucursalId: true } },
      },
    }),
    prisma.product.findMany({
      where: isAdmin ? {} : sucursalFilter,
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true, sku: true },
    }),
  ]);

  const productoSeleccionado = productoId ? products.find(p => p.id === productoId) : null;

  return (
    <div className="p-6">
      <MovimientosList movements={movements} products={products} userId={user.id}
        productoSeleccionado={productoSeleccionado ?? null} />
    </div>
  );
}
