import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPrisma } from "@/lib/prisma";
import { GarantiasClient } from "./garantias-client";

export default async function GarantiasPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { role: string; sucursalId: string | null; id: string };
  const prisma = getPrisma();
  if (!prisma) return <p className="p-6 text-[var(--color-ink-soft)]">Error de conexi&oacute;n</p>;

  const isAdmin = user.role === "ADMIN_GENERAL";
  const productFilter = isAdmin ? {} : { sucursalId: user.sucursalId ?? "" };

  const [warranties, products] = await Promise.all([
    prisma.warranty.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        product: { select: { id: true, nombre: true, modelo: true, sku: true, sucursalId: true } },
      },
    }),
    prisma.product.findMany({
      where: productFilter,
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true, modelo: true, sku: true },
    }),
  ]);

  const filteredWarranties = isAdmin
    ? warranties
    : warranties.filter((w) => w.product.sucursalId === user.sucursalId);

  return (
    <div className="p-6">
      <GarantiasClient warranties={filteredWarranties} products={products} userId={user.id} />
    </div>
  );
}
