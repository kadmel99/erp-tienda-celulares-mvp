import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPrisma } from "@/lib/prisma";
import { PosClient } from "./pos-client";

export default async function PosPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { role: string; sucursalId: string | null; id: string; name?: string | null };
  const prisma = getPrisma();
  if (!prisma) return <p className="p-6 text-[var(--color-ink-soft)]">Error de conexi&oacute;n</p>;

  if (!user.sucursalId) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="rounded-[14px] border border-[var(--color-line)] bg-[var(--color-panel)] p-8 text-center"
          style={{ boxShadow: "var(--shadow-panel)" }}>
          <p className="text-[var(--color-ink-soft)]">
            No tienes una sucursal asignada. Contacta al administrador.
          </p>
        </div>
      </div>
    );
  }

  const [products, clients, openSession] = await Promise.all([
    prisma.product.findMany({
      where: { sucursalId: user.sucursalId, disponible: true, cantidad: { gt: 0 } },
      orderBy: { nombre: "asc" },
    }),
    prisma.cliente.findMany({ orderBy: { nombre: "asc" } }),
    prisma.cashRegisterSession.findFirst({
      where: { sucursalId: user.sucursalId, cerradaEn: null },
    }),
  ]);

  return (
    <PosClient
      products={products}
      clients={clients}
      sucursalId={user.sucursalId}
      userId={user.id}
      cajaAbierta={!!openSession}
    />
  );
}
