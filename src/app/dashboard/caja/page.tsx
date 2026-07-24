import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPrisma } from "@/lib/prisma";
import { CajaClient } from "./caja-client";

export default async function CajaPage(props: { searchParams?: Promise<{ sucursalId?: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { role: string; sucursalId: string | null; sucursalIds: string[]; id: string; name?: string | null };
  const prisma = getPrisma();
  if (!prisma) return <p className="p-6 text-[var(--color-ink-soft)]">Error de conexi&oacute;n</p>;

  const isFiscal = user.role === "REVISION_FISCAL";
  const searchParams = await props.searchParams;

  let sucursales: { id: string; nombre: string }[] = [];
  let sucursalId = user.sucursalId;

  if (isFiscal) {
    sucursales = await prisma.sucursal.findMany({
      where: { id: { in: user.sucursalIds } },
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true },
    });
    const requested = searchParams?.sucursalId;
    sucursalId = requested && user.sucursalIds.includes(requested) ? requested : (sucursales[0]?.id ?? null);
  }

  if (!sucursalId) {
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
    where: { sucursalId, cerradaEn: null },
    include: {
      movimientos: { orderBy: { createdAt: "desc" } },
    },
  });

  const closedSessions = await prisma.cashRegisterSession.findMany({
    where: { sucursalId, cerradaEn: { not: null } },
    orderBy: { cerradaEn: "desc" },
    take: 20,
    include: {
      movimientos: true,
    },
  });

  return (
    <div className="p-6">
      {isFiscal && sucursales.length > 1 && (
        <SucursalSwitcher sucursales={sucursales} sucursalId={sucursalId} />
      )}
      <CajaClient
        openSession={openSession}
        closedSessions={closedSessions}
        sucursalId={sucursalId}
        userId={user.id}
        userName={session.user.name ?? "Usuario"}
        readOnly={isFiscal}
      />
    </div>
  );
}

function SucursalSwitcher({ sucursales, sucursalId }: { sucursales: { id: string; nombre: string }[]; sucursalId: string }) {
  return (
    <form action="/dashboard/caja" method="GET" className="mb-4 flex items-center gap-2">
      <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Sucursal</label>
      <select
        name="sucursalId"
        defaultValue={sucursalId}
        className="rounded-[10px] border-none bg-[var(--color-panel-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
        style={{ boxShadow: "var(--shadow-inset)" }}
      >
        {sucursales.map((s) => (
          <option key={s.id} value={s.id}>{s.nombre}</option>
        ))}
      </select>
      <button type="submit"
        className="rounded-[10px] border border-[var(--color-line)] bg-[var(--color-panel-raised)] px-3 py-2 text-sm font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
        Ver
      </button>
    </form>
  );
}
