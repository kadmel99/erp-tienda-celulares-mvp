import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPrisma } from "@/lib/prisma";
import { CajaClient } from "./caja-client";

export default async function CajaPage() {
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
          <p className="text-[var(--color-ink-soft)]">No tienes una sucursal asignada.</p>
        </div>
      </div>
    );
  }

  const openSession = await prisma.cashRegisterSession.findFirst({
    where: { sucursalId: user.sucursalId, cerradaEn: null },
    include: {
      movimientos: { orderBy: { createdAt: "desc" } },
    },
  });

  const closedSessions = await prisma.cashRegisterSession.findMany({
    where: { sucursalId: user.sucursalId, cerradaEn: { not: null } },
    orderBy: { cerradaEn: "desc" },
    take: 20,
    include: {
      movimientos: true,
    },
  });

  return (
    <div className="p-6">
      <CajaClient
        openSession={openSession}
        closedSessions={closedSessions}
        sucursalId={user.sucursalId}
        userId={user.id}
        userName={session.user.name ?? "Usuario"}
      />
    </div>
  );
}
