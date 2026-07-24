import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPrisma } from "@/lib/prisma";
import { FacturacionClient } from "./facturacion-client";

export default async function FacturacionPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { role: string; sucursalId: string | null };
  const prisma = getPrisma();
  if (!prisma) return <p className="p-6 text-[var(--color-ink-soft)]">Error de conexi&oacute;n</p>;

  const isAdmin = user.role === "ADMIN_GENERAL";
  const filter = isAdmin ? {} : { sucursalId: user.sucursalId ?? "" };

  const invoices = await prisma.invoice.findMany({
    where: filter,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      sucursal: { select: { nombre: true } },
      sale: {
        select: {
          total: true,
          cliente: { select: { nombre: true } },
        },
      },
    },
  });

  return (
    <div className="p-6">
      <FacturacionClient invoices={invoices} />
    </div>
  );
}
