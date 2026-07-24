import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPrisma } from "@/lib/prisma";
import { AuditoriaClient } from "./auditoria-client";

export default async function AuditoriaPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { id: string; role: string; sucursalIds: string[] };
  if (user.role !== "ADMIN_GENERAL" && user.role !== "REVISION_FISCAL") {
    redirect("/dashboard");
  }

  const prisma = getPrisma();
  if (!prisma) return <p className="p-6 text-[var(--color-ink-soft)]">Error de conexi&oacute;n</p>;

  const isAdmin = user.role === "ADMIN_GENERAL";
  const filter = isAdmin ? {} : { sucursalId: { in: user.sucursalIds } };

  const [hallazgos, sucursales] = await Promise.all([
    prisma.hallazgo.findMany({
      where: filter,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { sucursal: { select: { nombre: true } } },
    }),
    isAdmin
      ? prisma.sucursal.findMany({ where: { activa: true }, orderBy: { nombre: "asc" }, select: { id: true, nombre: true } })
      : prisma.sucursal.findMany({ where: { id: { in: user.sucursalIds } }, orderBy: { nombre: "asc" }, select: { id: true, nombre: true } }),
  ]);

  const autorIds = Array.from(new Set(hallazgos.map((h) => h.userId)));
  const autores = autorIds.length > 0
    ? await prisma.usuario.findMany({ where: { id: { in: autorIds } }, select: { id: true, nombre: true } })
    : [];
  const autorPorId = new Map(autores.map((a) => [a.id, a.nombre]));

  const hallazgosConAutor = hallazgos.map((h) => ({
    ...h,
    autorNombre: autorPorId.get(h.userId) ?? "—",
  }));

  return (
    <div className="p-6">
      <AuditoriaClient
        hallazgos={hallazgosConAutor}
        sucursales={sucursales}
        isAdmin={isAdmin}
      />
    </div>
  );
}
